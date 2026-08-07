import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "@/lib/env";
import { UPLOADS_DIR } from "@/lib/storage";
import authRoutes from "@/routes/auth.routes";
import dashboardRoutes from "@/routes/dashboard.routes";
import leadRoutes from "@/routes/lead.routes";
import customerRoutes from "@/routes/customer.routes";
import followUpRoutes from "@/routes/followUp.routes";
import userRoutes from "@/routes/user.routes";
import uploadRoutes from "@/routes/upload.routes";
import productRoutes from "@/routes/product.routes";
import quotationRoutes from "@/routes/quotation.routes";
import whatsappRoutes from "@/routes/whatsapp.routes";
import webhookRoutes from "@/routes/webhook.routes";
import aiRoutes from "@/routes/ai.routes";
import notificationRoutes from "@/routes/notification.routes";
import reportRoutes from "@/routes/report.routes";
import adminRoutes from "@/routes/admin.routes";
import whatsappTemplateRoutes from "@/routes/whatsappTemplate.routes";
import { errorHandler } from "@/middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.use("/uploads", express.static(UPLOADS_DIR));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/leads", leadRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/follow-ups", followUpRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/quotations", quotationRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/webhooks", webhookRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/whatsapp-templates", whatsappTemplateRoutes);

  app.use(errorHandler);

  return app;
}
