import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export interface StorageProvider {
  saveFile(buffer: Buffer, originalName: string): Promise<{ url: string }>;
}

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

export class LocalStorageProvider implements StorageProvider {
  async saveFile(buffer: Buffer, originalName: string): Promise<{ url: string }> {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const ext = path.extname(originalName);
    const filename = `${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(UPLOADS_DIR, filename), buffer);
    return { url: `/uploads/${filename}` };
  }
}

export const storageProvider: StorageProvider = new LocalStorageProvider();
export { UPLOADS_DIR };
