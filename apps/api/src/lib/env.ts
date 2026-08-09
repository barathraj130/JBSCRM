import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  // Comma-separated list of exact allowed origins (in addition to any Vercel
  // preview/production URLs for this project, which are matched separately).
  corsOrigins: required("CORS_ORIGIN", "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL"),
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  whatsappProvider: process.env.WHATSAPP_PROVIDER ?? "mock",
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
  n8nApiKey: process.env.N8N_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  aiModel: process.env.AI_MODEL ?? "claude-sonnet-5",
  companyName: process.env.COMPANY_NAME ?? "JBS Knit Wear",
  companyGstin: process.env.COMPANY_GSTIN ?? "",
  companyAddress: process.env.COMPANY_ADDRESS ?? "",
  apiPublicUrl: process.env.API_PUBLIC_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,
  indiamartApiKey: process.env.INDIAMART_API_KEY,
  uncontactedLeadAlertMinutes: Number(process.env.UNCONTACTED_LEAD_ALERT_MINUTES ?? 15),
};
