import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 🔍 Import tipi per i filtri (dal file che abbiamo creato)
import type { 
  UserFilterSettings, 
  Platform, 
  SalesType, 
  MainGoal, 
  ExperienceLevel 
} from "./filters";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // email
  password: text("password").notNull(),
  plan: text("plan").default("FREE").notNull(), // FREE, PRO
  creditsBalance: integer("credits_balance").default(0).notNull(),
  currentProgram: text("current_program").default("TASKS_30D").notNull(), // TASKS_30D, TASKS_PRO_60
  currentDay: integer("current_day").default(1).notNull(),
  onboarding: jsonb("onboarding").$type<{
    platform?: string[]; // IG, FB
    productType?: string[]; // DIGITAL, PHYSICAL, SERVICE
    goal?: string[]; // DM, LINK, SALES, BRAND
    timeMode?: number; // 15, 30, 60
    level?: string; // BEGINNER, INTERMEDIATE
    target?: string;
    tone?: string;
  }>(),
 // ─────────────────────────────────────
  // 🔍 NUOVI CAMPI PER FILTRI (AGGIUNGI QUI)
  // ─────────────────────────────────────
  
  // Impostazioni filtri (JSON strutturato)
  filterSettings: jsonb("filter_settings").$type<UserFilterSettings>(),
  
  // Profilo utente per matching con i task
  experienceLevel: varchar("experience_level", { length: 20 }), // "Principiante" | "Intermedio" | "Avanzato"
  platforms: jsonb("platforms").$type<Platform[]>(),            // Array di stringhe
  salesTypes: jsonb("sales_types").$type<SalesType[]>(),        // Array di stringhe  
  mainGoal: varchar("main_goal", { length: 50 }),               // "Generare Lead" | ...
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  taskId: text("task_id").notNull(),
  day: integer("day").notNull(),
  programId: text("program_id").notNull(),
  status: text("status").notNull(), // Pending, Done, Skipped, Deferred
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kpiEntries = pgTable("kpi_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: integer("day").notNull(),
  programId: text("program_id").notNull(),
  data: jsonb("data").notNull().$type<{
    conversationsCount?: number;
    dmSent?: number;
    interestedContacts?: number;
    salesCount?: number;
    notes?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // positive or negative
  type: text("type").notNull(), // REDEEM, AI_USAGE, BONUS
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redeemCodes = pgTable("redeem_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  credits: integer("credits").notNull(),
  maxUses: integer("max_uses").default(1).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redeemCodeUses = pgTable("redeem_code_uses", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiUsages = pgTable("ai_usages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  featureId: text("feature_id"),
  inputData: jsonb("input_data"),
  outputText: text("output_text"),
  cost: integer("cost").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const userRelations = relations(users, ({ many }) => ({
  tasks: many(userTasks),
  kpiEntries: many(kpiEntries),
  transactions: many(creditTransactions),
  redeemUses: many(redeemCodeUses),
  aiUsages: many(aiUsages),
}));

export const userTasksRelations = relations(userTasks, ({ one }) => ({
  user: one(users, {
    fields: [userTasks.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, creditsBalance: true, currentProgram: true, currentDay: true });
export const insertUserTaskSchema = createInsertSchema(userTasks).omit({ id: true, createdAt: true, completedAt: true });
export const insertKpiEntrySchema = createInsertSchema(kpiEntries).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// ─────────────────────────────────────
// 🔍 AGGIORNA IL TIPO User CON I NUOVI CAMPI
// ─────────────────────────────────────
// Se usi $inferSelect (consigliato), Drizzle lo aggiorna automaticamente ✅
// Ma per chiarezza e autocomplete, puoi estendere esplicitamente:
export type UserWithFilters = User & {
  filterSettings?: UserFilterSettings;
  experienceLevel?: ExperienceLevel;
  platforms?: Platform[];
  salesTypes?: SalesType[];
  mainGoal?: MainGoal;
};

export type UserTask = typeof userTasks.$inferSelect;
export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;

export type KpiEntry = typeof kpiEntries.$inferSelect;
export type InsertKpiEntry = z.infer<typeof insertKpiEntrySchema>;

// Custom Types for Frontend
export interface Task {
  day: number;
  task_id: string;
  task_order: number;
  task_type: string;
  title: string;
  instructions: string;
  estimated_time: string;
  time_mode: string;
// 🔍 CAMPI DAL FOGLIO (nomi snake_case o come nel foglio)
//  platform: string;
//  product_type: string;
//  goal: string;
//  level: string;
  level?: string;              // ← "BEGINNER", "INTERMEDIATE", etc.
  platform?: string | string[]; // ← "Instagram", "ALL", etc.
  product_type?: string | string[]; // ← "Digitale", "Coaching/Servizio", etc.
  goal?: string;               // ← "DM", "BRAND", "SALES", "FOLLOWER"
  kpi_name?: string;
  kpi_target?: string;
  fallback_task_id?: string;
  critical_task?: string;
  ai_support_available?: string;
  ai_feature_id?: string;
  ai_feature_label?: string;
  ai_prompt_template?: string;
  ai_variables?: string;
  ai_output_type?: string;
  ai_complexity?: string;
  pro_only?: string;
  credits_cost?: string;
  unlock_type?: string;
  ai_visible_trigger?: string;
  internal_notes?: string;
  status?: string; // Merged from DB
}

export interface DayState {
  day: number;
  tasks: Task[];
  isLocked: boolean;
  isCompleted: boolean;
}

export type OnboardingData = NonNullable<User['onboarding']>;
