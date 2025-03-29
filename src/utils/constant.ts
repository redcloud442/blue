import { redis } from "./redis.js";

export const bankWords = async () => {
  const data = await redis.get("bank_keyword");

  if (data) {
    try {
      const parsed = data as string[];
      return Array.isArray(parsed) ? parsed : BANK_KEYWORDS;
    } catch (error) {
      return BANK_KEYWORDS;
    }
  } else {
    return BANK_KEYWORDS;
  }
};

export const BANK_KEYWORDS = [
  "transaction id",
  "reference number",
  "successful",
  "completed",
  "confirmed",
  "completed",
  "amount",
  "₱",
  "Reference ID",
  "Ref No.",
  "+63",
];
