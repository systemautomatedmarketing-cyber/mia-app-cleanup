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

export type TaskStatus = 'draft' | 'active' | 'archived';
export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'twitter' | 'all';
export type ProductType = 'digitale' | 'coaching' | 'servizio' | 'ecommerce' | 'altro';
export type GoalType = 'dm' | 'brand' | 'sales' | 'follower' | 'engagement';
export type LevelType = 'beginner' | 'intermediate' | 'advanced';
export type UnlockType = 'none' | 'pro' | 'credits' | 'streak';
export type AiComplexity = 'low' | 'medium' | 'high';
export type AiOutputType = 'text' | 'image-prompt' | 'json';
export type TimeMode = 'fixed' | 'range' | 'flexible';

export interface Task {
  // 🔹 CAMPI OBBLIGATORI (core)
  day: number;
  task_id: string;
  task_order: number;
  task_type: string;
  title: string;
  instructions: string;
  estimated_time: string; // es: "5 min", "10-15 min"
  time_mode: TimeMode; //'fixed' | 'range' | 'flexible';
  
  // 🔹 CAMPI DI FILTRO (opzionali ma tipizzati)
  level?: LevelType;
  platform?: Platform | Platform[];
  product_type?: ProductType | ProductType[];
  goal?: GoalType;
  
  // 🔹 KPI & METRICHE
  kpi_name?: string;        // es: "Profile Visits"
  kpi_target?: string;      // es: "+20%"
  
  // 🔹 LOGICA TASK
  fallback_task_id?: string;
  critical_task?: 'true' | 'false'; // mantengo string per compatibilità foglio
  
  // 🔹 AI CONFIG (tipizzati)
  ai_support_available?: 'true' | 'false';
  ai_feature_id?: string;
  ai_feature_label?: string;
  ai_prompt_template?: string;      // template con {variables}
  ai_variables?: Record<string, any>; // ← JSON parsato, non string!
  ai_output_type?: AiOutputType; //'text' | 'image-prompt' | 'json';
  ai_complexity?: AiComplexity; //'low' | 'medium' | 'high';
  
  // 🔹 MONETIZZAZIONE (tipi corretti!)
  pro_only?: boolean;               // ← BOOLEANO, non string!
  credits_cost?: number;            // ← NUMBER, non string!
  unlock_type?: UnlockType; //'none' | 'pro' | 'credits' | 'streak';
  ai_visible_trigger?: 'always' | 'after-completion' | 'pro-only';
  
  // 🔹 INTERNI
  internal_notes?: string;
  status?: TaskStatus;
  
  // 🔹 CAMPI AGGIUNTIVI PER UX
  expected_result?: string;         // es: "+15-30 profile visits"
  why_it_works?: string;            // spiegazione breve per l'utente

 // ── CAMPI TEMPORANEI PER LOGICA FRONTEND (opzionali) ──
  __injected?: boolean;              // task iniettato da defer/sostituzione
  __carryOriginalTaskId?: string;    // ID del task originale se iniettato
  __deferCount?: number;             // quante volte è stato rimandato

}


// ─────────────────────────────────────────────
// HELPER: Converte dati grezzi da Google Sheets in Task tipizzato
// Usalo quando recuperi i task dal foglio elettronico
// ─────────────────────────────────────────────
export function parseTaskFromSheet(data: Record<string, any>): Task {
  // Funzione sicura per parsare JSON da stringa
  const safeJsonParse = (str: any): Record<string, any> | undefined => {
    if (!str || typeof str !== 'string') return undefined;
    try {
      return JSON.parse(str);
    } catch {
      return undefined;
    }
  };

  // Validazione status
  const validStatuses: TaskStatus[] = ['draft', 'active', 'archived'];
  const parseStatus = (s?: any): TaskStatus | undefined => {
    if (!s) return undefined;
    const status = String(s).toLowerCase();
    return validStatuses.includes(status as TaskStatus) ? (status as TaskStatus) : undefined;
  };

  // Conversione boolean da stringa ("true"/"false") o booleano reale
  const parseBoolean = (val: any): boolean | undefined => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return undefined;
  };

  // Conversione number da stringa
  const parseNumber = (val: any): number | undefined => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };

  return {
    // Campi obbligatori (assumo siano già corretti dal foglio)
    day: Number(data.day) || 1,
    task_id: String(data.task_id),
    task_order: Number(data.task_order) || 0,
    task_type: String(data.task_type),
    title: String(data.title),
    instructions: String(data.instructions),
    estimated_time: String(data.estimated_time),
    time_mode: (['fixed', 'range', 'flexible'].includes(data.time_mode) 
      ? data.time_mode 
      : 'fixed') as TimeMode,
    
    // Campi opzionali con parsing sicuro
    level: data.level?.toLowerCase() as LevelType | undefined,
    platform: data.platform, // può essere string o string[], lascio flessibile
    product_type: data.product_type,
    goal: data.goal?.toLowerCase() as GoalType | undefined,
    
    kpi_name: data.kpi_name,
    kpi_target: data.kpi_target,
    
    fallback_task_id: data.fallback_task_id,
    critical_task: data.critical_task, // mantengo string per compatibilità
    
    ai_support_available: data.ai_support_available,
    ai_feature_id: data.ai_feature_id,
    ai_feature_label: data.ai_feature_label,
    ai_prompt_template: data.ai_prompt_template,
    ai_variables: safeJsonParse(data.ai_variables),
    ai_output_type: data.ai_output_type as AiOutputType | undefined,
    ai_complexity: data.ai_complexity as AiComplexity | undefined,
    
    // ⚠️ CONVERSIONI CRITICHE (da string a tipo corretto)
    pro_only: parseBoolean(data.pro_only),
    credits_cost: parseNumber(data.credits_cost),
    unlock_type: data.unlock_type as UnlockType | undefined,
    ai_visible_trigger: data.ai_visible_trigger,
    
    internal_notes: data.internal_notes,
    status: parseStatus(data.status),
    
    // Campi UX
    expected_result: data.expected_result,
    why_it_works: data.why_it_works,
  };
}

export interface DayState {
  day: number;
  tasks: Task[];
  isLocked: boolean;
  isCompleted: boolean;
}

export type OnboardingData = NonNullable<User['onboarding']>;

