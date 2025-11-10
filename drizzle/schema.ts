import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

export const bombonas = mysqlTable("bombonas", {
  id: int("id").autoincrement().primaryKey(),
  numero: varchar("numero", { length: 10 }).notNull().unique(),
  status: mysqlEnum("status", [
    "galpao",
    "galpao_contaminada",
    "galpao_descontaminada",
    "a_caminho",
    "no_local",
    "recolhida",
    "entregue_galpao",
  ]).default("galpao_contaminada").notNull(),
  localizacao: text("localizacao"),
  criadoPorId: int("criadoPorId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bombona = typeof bombonas.$inferSelect;
export type InsertBombona = typeof bombonas.$inferInsert;

export const rastreamentos = mysqlTable("rastreamentos", {
  id: int("id").autoincrement().primaryKey(),
  bombonaId: int("bombonaId").notNull().references(() => bombonas.id, { onDelete: "cascade" }),
  statusAnterior: mysqlEnum("statusAnterior", [
    "galpao",
    "galpao_contaminada",
    "galpao_descontaminada",
    "a_caminho",
    "no_local",
    "recolhida",
    "entregue_galpao",
  ]),
  statusNovo: mysqlEnum("statusNovo", [
    "galpao",
    "galpao_contaminada",
    "galpao_descontaminada",
    "a_caminho",
    "no_local",
    "recolhida",
    "entregue_galpao",
  ]).notNull(),
  localizacao: text("localizacao"),
  usuarioId: int("usuarioId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rastreamento = typeof rastreamentos.$inferSelect;
export type InsertRastreamento = typeof rastreamentos.$inferInsert;

export const anotacoes = mysqlTable("anotacoes", {
  id: int("id").autoincrement().primaryKey(),
  bombonaId: int("bombonaId").notNull().references(() => bombonas.id, { onDelete: "cascade" }),
  conteudo: text("conteudo").notNull(),
  usuarioId: int("usuarioId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Anotacao = typeof anotacoes.$inferSelect;
export type InsertAnotacao = typeof anotacoes.$inferInsert;
