export interface IndiaMartLeadPayload {
  externalLeadId: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  productInterested?: string;
  message?: string;
  receivedAt: string;
}

export interface IndiaMartProvider {
  /**
   * Normalizes a raw webhook body into a structured lead. Real IndiaMART Lead Manager
   * "Push API" deliveries use SENDER_NAME / SENDER_MOBILE / SENDER_EMAIL / QUERY_MESSAGE /
   * UNIQUE_QUERY_ID / QUERY_TIME field names; this also accepts a simpler shape for local
   * testing so the mock provider can be exercised without mimicking IndiaMART's exact payload.
   */
  parseLeadPayload(rawBody: Record<string, unknown>): IndiaMartLeadPayload;
}
