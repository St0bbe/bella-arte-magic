/**
 * Generates a valid PIX BR Code payload following the EMV standard
 * Reference: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */

function padTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

interface PixPayloadParams {
  pixKey: string;
  pixKeyType: string;
  merchantName: string;
  merchantCity?: string;
  amount?: number;
  description?: string;
}

export function generatePixPayload({
  pixKey,
  pixKeyType,
  merchantName,
  merchantCity = "SAO PAULO",
  amount,
  description,
}: PixPayloadParams): string {
  // Format key based on type
  let formattedKey = pixKey;
  if (pixKeyType === "phone") {
    // Ensure +55 prefix
    const digits = pixKey.replace(/\D/g, "");
    formattedKey = digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
  } else if (pixKeyType === "cpf" || pixKeyType === "cnpj") {
    formattedKey = pixKey.replace(/\D/g, "");
  }

  // GUI (Global Unique Identifier for PIX)
  const gui = padTLV("00", "br.gov.bcb.pix");
  const key = padTLV("01", formattedKey);
  let merchantAccountInfo = gui + key;
  
  if (description) {
    merchantAccountInfo += padTLV("02", description.substring(0, 25));
  }

  let payload = "";
  // Payload Format Indicator
  payload += padTLV("00", "01");
  // Merchant Account Information (PIX)
  payload += padTLV("26", merchantAccountInfo);
  // Merchant Category Code
  payload += padTLV("52", "0000");
  // Transaction Currency (986 = BRL)
  payload += padTLV("53", "986");

  // Transaction Amount (optional)
  if (amount && amount > 0) {
    payload += padTLV("54", amount.toFixed(2));
  }

  // Country Code
  payload += padTLV("58", "BR");
  // Merchant Name (max 25 chars, no accents)
  const cleanName = merchantName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 25)
    .toUpperCase();
  payload += padTLV("59", cleanName);
  // Merchant City (max 15 chars)
  const cleanCity = merchantCity
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .substring(0, 15)
    .toUpperCase();
  payload += padTLV("60", cleanCity);

  // Additional Data Field (txid)
  payload += padTLV("62", padTLV("05", "***"));

  // CRC16 placeholder - ID 63, length 04
  payload += "6304";

  // Calculate and append CRC
  const crc = computeCRC16(payload);
  payload += crc;

  return payload;
}
