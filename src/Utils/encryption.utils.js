import crypto from "crypto";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "base64"); // buffer

export const encrypt = (text) => {
  const iv = crypto.randomBytes(parseInt(process.env.IV_LENGTH)); // buffer

  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let encryptedText = cipher.update(text, "utf-8", "hex"); // from utf-8 to hex

  encryptedText += cipher.final("hex");

  return iv.toString("hex") + ":" + encryptedText;
};

export const decrypt = (encryptedText) => {
  const [ivHex, cipher] = encryptedText.split(":");

  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);

  let text = decipher.update(cipher, "hex", "utf-8");

  text += decipher.final("utf-8");

  return text;
};
