import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.APP_SECRET || "olimpo_fallback_secret_key_32bytes!")
  .digest();

/**
 * Criptografa strings sensíveis (como tokens de acesso da Meta) antes de salvar no banco.
 * Utiliza AES-256-GCM com IV aleatório para garantir confidencialidade e integridade.
 */
export function encryptToken(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  // Formato: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Descriptografa tokens de acesso da Meta para uso exclusivo em rotas backend seguras.
 */
export function decryptToken(cipherText: string): string {
  const [ivHex, authTagHex, encrypted] = cipherText.split(":");
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Formato de token criptografado inválido.");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    SECRET_KEY,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Gera um hash SHA-256 criptográfico para snapshots imutáveis de sorteio.
 */
export function generateSnapshotHash(data: unknown): string {
  const serialized = JSON.stringify(data);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}
