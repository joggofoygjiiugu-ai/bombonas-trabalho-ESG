import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de bombonas com numeração única (B001, B002, etc.)
 * Cada bombona tem um ciclo de vida com múltiplos status
 */
export const bombonas = mysqlTable("bombonas", {
  id: int("id").autoincrement().primaryKey(),
  /** Numeração única da bombona (B001, B002, etc.) */
  numero: varchar("numero", { length: 10 }).notNull().unique(),
  /** Status atual da bombona */
  status: mysqlEnum("status", [
    "galpao",           // No galpão
    "a_caminho",        // A caminho do local
    "no_local",         // No local de entrega
    "recolhida",        // Recolhida
    "entregue_galpao",  // Entregue ao galpão
  ]).default("galpao").notNull(),
  /** Descrição ou local atual da bombona */
  localizacao: text("localizacao"),
  /** Criado por qual usuário */
  criadoPorId: int("criadoPorId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bombona = typeof bombonas.$inferSelect;
export type InsertBombona = typeof bombonas.$inferInsert;

/**
 * Tabela de histórico de rastreamento
 * Cada mudança de status é registrada com timestamp e anotações
 */
export const rastreamentos = mysqlTable("rastreamentos", {
  id: int("id").autoincrement().primaryKey(),
  /** Referência à bombona */
  bombonaId: int("bombonaId").notNull().references(() => bombonas.id, { onDelete: "cascade" }),
  /** Status anterior */
  statusAnterior: mysqlEnum("statusAnterior", [
    "galpao",
    "a_caminho",
    "no_local",
    "recolhida",
    "entregue_galpao",
  ]),
  /** Status novo */
  statusNovo: mysqlEnum("statusNovo", [
    "galpao",
    "a_caminho",
    "no_local",
    "recolhida",
    "entregue_galpao",
  ]).notNull(),
  /** Localização ou descrição do evento */
  localizacao: text("localizacao"),
  /** Usuário que fez a mudança */
  usuarioId: int("usuarioId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rastreamento = typeof rastreamentos.$inferSelect;
export type InsertRastreamento = typeof rastreamentos.$inferInsert;

/**
 * Tabela de anotações para cada bombona
 * Permite adicionar notas e observações durante o rastreamento
 */
export const anotacoes = mysqlTable("anotacoes", {
  id: int("id").autoincrement().primaryKey(),
  /** Referência à bombona */
  bombonaId: int("bombonaId").notNull().references(() => bombonas.id, { onDelete: "cascade" }),
  /** Conteúdo da anotação */
  conteudo: text("conteudo").notNull(),
  /** Usuário que criou a anotação */
  usuarioId: int("usuarioId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anotacao = typeof anotacoes.$inferSelect;
export type InsertAnotacao = typeof anotacoes.$inferInsert;