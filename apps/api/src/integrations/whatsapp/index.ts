import { env } from "@/lib/env";
import type { WhatsAppProvider } from "./provider";
import { MockWhatsAppProvider } from "./mockProvider";

function createWhatsAppProvider(): WhatsAppProvider {
  switch (env.whatsappProvider) {
    case "mock":
    default:
      return new MockWhatsAppProvider();
  }
}

export const whatsappProvider = createWhatsAppProvider();
export type { WhatsAppProvider } from "./provider";
