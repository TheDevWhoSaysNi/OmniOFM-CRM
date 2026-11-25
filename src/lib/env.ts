import { z } from "zod";

const optionalSecret = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== "" ? value : undefined));

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== "" ? value : undefined))
  .pipe(z.string().url().optional());

const envSchema = z.object({
  APP_BASE_URL: z.string().url().default("http://localhost:3060"),
  AUTH_JWT_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  TOKEN_ENCRYPTION_KEY: optionalSecret.pipe(z.string().min(32).optional()),

  FANVUE_CLIENT_ID: z.string().optional(),
  FANVUE_CLIENT_SECRET: z.string().optional(),
  FANVUE_AUTHORIZATION_URL: z.string().url().default("https://auth.fanvue.com/oauth2/auth"),
  FANVUE_TOKEN_URL: z.string().url().default("https://auth.fanvue.com/oauth2/token"),
  FANVUE_API_BASE: z.string().url().default("https://api.fanvue.com"),
  FANVUE_API_VERSION: z.string().default("2025-06-26"),
  FANVUE_REDIRECT_URI: z.string().url().optional(),
  FANVUE_WEBHOOK_SECRET: z.string().optional(),
  FANVUE_AGENCY_SCOPES: z.string().optional(),
  FANVUE_CREATOR_SCOPES: z.string().optional(),

  ONLYFANS_CLIENT_ID: z.string().optional(),
  ONLYFANS_CLIENT_SECRET: z.string().optional(),
  ONLYFANS_AUTHORIZATION_URL: z.string().url().optional(),
  ONLYFANS_TOKEN_URL: z.string().url().optional(),
  ONLYFANS_REDIRECT_URI: z.string().url().optional(),
  ONLYFANS_WEBHOOK_SECRET: z.string().optional(),

  STACKED_API_BASE_URL: z.string().url().default("https://api.stacked.com"),
  STACKED_CLIENT_ID: z.string().optional(),
  STACKED_CLIENT_SECRET: z.string().optional(),
  STACKED_REDIRECT_URI: z.string().url().optional(),
  STACKED_API_KEY: optionalSecret,
  STACKED_WEBHOOK_SECRET: optionalSecret,

  QC_BRIDGE_BASE_URL: optionalUrl,
  QC_BRIDGE_SERVICE_TOKEN: optionalSecret.pipe(z.string().min(16).optional()),

  HQ_API_BASE_URL: optionalUrl,
  HQ_SHARED_SECRET: optionalSecret.pipe(z.string().min(16).optional()),

  HOLDOC_N8N_WEBHOOK_URL: optionalUrl,
  HOLDOC_WEBHOOK_SECRET: optionalSecret.pipe(z.string().min(16).optional()),

  TELEGRAM_BOT_DEFAULT_WEBHOOK_BASE_URL: z.string().url().optional(),
  SUPER_ADMIN_EMAILS: z.string().optional(),
  INACTIVITY_DEACTIVATION_DAYS: z.coerce.number().int().positive().default(90),
  INACTIVITY_PURGE_DAYS_AFTER_DEACTIVATION: z.coerce.number().int().positive().default(90),
  CRON_SHARED_SECRET: optionalSecret.pipe(z.string().min(16).optional()),

  FANVUE_SYNC_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),

  FEATURE_INBOX: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),

  RESEND_API_KEY: z.string().optional(),
  NOTIFY_FROM_EMAIL: z.string().email().optional(),

  ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_API_KEY: z.string().optional(),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error("Invalid environment variables:", envResult.error.flatten().fieldErrors);
  throw new Error("Environment validation failed.");
}

export const env = envResult.data;