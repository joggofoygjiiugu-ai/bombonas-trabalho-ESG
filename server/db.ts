import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, bombonas, Bombona, InsertBombona, rastreamentos, Rastreamento, InsertRastreamento, anotacoes, Anotacao, InsertAnotacao } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ BOMBONAS ============

/**
 * Obtém o próximo número de bombona (B001, B002, etc.)
 */
export async function getNextBombonaNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const lastBombona = await db
    .select()
    .from(bombonas)
    .orderBy(desc(bombonas.id))
    .limit(1);

  if (lastBombona.length === 0) {
    return "B001";
  }

  const lastNumber = parseInt(lastBombona[0].numero.replace("B", ""), 10);
  const nextNumber = lastNumber + 1;
  return `B${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Cria uma nova bombona
 */
export async function createBombona(
  userId: number,
  localizacao?: string
): Promise<Bombona> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const numero = await getNextBombonaNumber();

  const result = await db.insert(bombonas).values({
    numero,
    status: "galpao",
    localizacao,
    criadoPorId: userId,
  });

  const created = await db
    .select()
    .from(bombonas)
    .where(eq(bombonas.numero, numero))
    .limit(1);

  if (created.length === 0) throw new Error("Failed to create bombona");
  return created[0];
}

/**
 * Obtém uma bombona por número (B001, B002, etc.)
 */
export async function getBombonaByNumero(numero: string): Promise<Bombona | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bombonas)
    .where(eq(bombonas.numero, numero))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Obtém uma bombona por ID
 */
export async function getBombonaById(id: number): Promise<Bombona | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bombonas)
    .where(eq(bombonas.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Lista todas as bombonas
 */
export async function listBombonas(): Promise<Bombona[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bombonas).orderBy(desc(bombonas.createdAt));
}

/**
 * Atualiza o status de uma bombona
 */
export async function updateBombonaStatus(
  bombonaId: number,
  novoStatus: "galpao" | "a_caminho" | "no_local" | "recolhida" | "entregue_galpao",
  userId: number,
  localizacao?: string
): Promise<Bombona> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const bombona = await getBombonaById(bombonaId);
  if (!bombona) throw new Error("Bombona not found");

  // Registra no histórico
  await db.insert(rastreamentos).values({
    bombonaId,
    statusAnterior: bombona.status as any,
    statusNovo: novoStatus,
    localizacao,
    usuarioId: userId,
  });

  // Atualiza o status atual
  await db
    .update(bombonas)
    .set({ status: novoStatus, localizacao })
    .where(eq(bombonas.id, bombonaId));

  const updated = await getBombonaById(bombonaId);
  if (!updated) throw new Error("Failed to update bombona");
  return updated;
}

// ============ RASTREAMENTOS ============

/**
 * Obtém o histórico completo de rastreamento de uma bombona
 */
export async function getRastreamentoHistorico(bombonaId: number): Promise<Rastreamento[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(rastreamentos)
    .where(eq(rastreamentos.bombonaId, bombonaId))
    .orderBy(asc(rastreamentos.createdAt));
}

// ============ ANOTAÇÕES ============

/**
 * Adiciona uma anotação a uma bombona
 */
export async function addAnotacao(
  bombonaId: number,
  conteudo: string,
  userId: number
): Promise<Anotacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(anotacoes).values({
    bombonaId,
    conteudo,
    usuarioId: userId,
  });

  const created = await db
    .select()
    .from(anotacoes)
    .where(eq(anotacoes.bombonaId, bombonaId))
    .orderBy(desc(anotacoes.createdAt))
    .limit(1);

  if (created.length === 0) throw new Error("Failed to create anotacao");
  return created[0];
}

/**
 * Obtém todas as anotações de uma bombona
 */
export async function getAnotacoes(bombonaId: number): Promise<Anotacao[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(anotacoes)
    .where(eq(anotacoes.bombonaId, bombonaId))
    .orderBy(desc(anotacoes.createdAt));
}

/**
 * Deleta uma anotação
 */
export async function deleteAnotacao(anotacaoId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(anotacoes).where(eq(anotacoes.id, anotacaoId));
}

/**
 * Atualiza uma anotação
 */
export async function updateAnotacao(
  anotacaoId: number,
  conteudo: string
): Promise<Anotacao> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(anotacoes)
    .set({ conteudo })
    .where(eq(anotacoes.id, anotacaoId));

  const updated = await db
    .select()
    .from(anotacoes)
    .where(eq(anotacoes.id, anotacaoId))
    .limit(1);

  if (updated.length === 0) throw new Error("Failed to update anotacao");
  return updated[0];
}

// ============ QR CODE ============

/**
 * Gera um QR Code para uma bombona
 */
export async function generateQRCode(numero: string): Promise<string> {
  const qrcodeModule = await import("qrcode");
  const qrCodeDataUrl: string = await (qrcodeModule as any).toDataURL(numero, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
  });
  return qrCodeDataUrl;
}
