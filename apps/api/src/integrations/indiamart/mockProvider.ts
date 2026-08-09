import { HttpError } from "@/middleware/errorHandler";
import type { IndiaMartLeadPayload, IndiaMartProvider } from "./provider";

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export class MockIndiaMartProvider implements IndiaMartProvider {
  parseLeadPayload(rawBody: Record<string, unknown>): IndiaMartLeadPayload {
    // Real IndiaMART Lead Manager Push API field names
    const name = str(rawBody.SENDER_NAME) ?? str(rawBody.name);
    const phone = str(rawBody.SENDER_MOBILE) ?? str(rawBody.SENDER_PHONE) ?? str(rawBody.phone);
    if (!name || !phone) {
      throw new HttpError(400, "Lead payload must include a sender name and phone number");
    }

    const externalLeadId =
      str(rawBody.UNIQUE_QUERY_ID) ?? str(rawBody.externalLeadId) ?? `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      externalLeadId,
      name,
      phone,
      email: str(rawBody.SENDER_EMAIL) ?? str(rawBody.email),
      company: str(rawBody.SENDER_COMPANY) ?? str(rawBody.company),
      city: str(rawBody.SENDER_CITY) ?? str(rawBody.city),
      state: str(rawBody.SENDER_STATE) ?? str(rawBody.state),
      productInterested: str(rawBody.QUERY_PRODUCT_NAME) ?? str(rawBody.productInterested),
      message: str(rawBody.QUERY_MESSAGE) ?? str(rawBody.message),
      receivedAt: str(rawBody.QUERY_TIME) ?? str(rawBody.receivedAt) ?? new Date().toISOString(),
    };
  }
}
