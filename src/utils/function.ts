import { supabaseClient } from "./supabase.js";

export const sendErrorResponse = (message: string, status: number) =>
  Response.json({ message: message }, { status });

export const sendSuccessResponse = (message: string, status: number) =>
  Response.json({ message: message }, { status });

export const getClientIP = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
  request.headers.get("cf-connecting-ip") ||
  "unknown";

export const getUserSession = async (token: string) => {
  const supabase = supabaseClient;

  const session = await supabase.auth.getUser(token);

  if (session.error) {
    return null;
  }

  return session.data.user;
};

export const calculateFinalAmount = (
  amount: number,
  selectedEarnings: string
): number => {
  if (selectedEarnings === "PACKAGE") {
    const fee = amount * 0.1;
    return amount - fee;
  } else if (selectedEarnings === "REFERRAL") {
    const fee = amount * 0.1;
    return amount - fee;
  } else if (selectedEarnings === "WINNING") {
    const fee = amount * 0.1;
    return amount - fee;
  }
  return amount;
};

export const calculateFee = (
  amount: number,
  selectedEarnings: string
): number => {
  if (selectedEarnings === "PACKAGE") {
    const fee = amount * 0.1;
    return fee;
  } else if (selectedEarnings === "REFERRAL") {
    const fee = amount * 0.1;
    return fee;
  } else if (selectedEarnings === "WINNING") {
    const fee = amount * 0.1;
    return fee;
  }

  return 0;
};

export const getPhilippinesTime = (
  date: Date,
  time: "start" | "end"
): string => {
  // Adjust the date to Philippine Time (UTC+8)
  const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
  const adjustedDate = new Date(date.getTime() + philippinesOffset);

  // Set the start or end of the day based on the time parameter
  if (time === "start") {
    adjustedDate.setUTCHours(0, 0, 0, 0);
  } else {
    adjustedDate.setUTCHours(23, 59, 59, 999);
  }

  // Convert back to UTC for accurate comparisons
  const resultDate = new Date(adjustedDate.getTime() - philippinesOffset);

  // Return ISO string for database queries
  return resultDate.toISOString();
};

export const toNonNegative = (num: number) =>
  num < 0 || Math.abs(num) < 1e-6 ? 0 : num;

export const getDepositBonus = (
  amount: number,
  type: "package" | "deposit"
) => {
  const depositTiers = [
    { deposit: 5000, count: 1, percentage: 0 },
    { deposit: 10000, count: 2, percentage: 0.001 },
    { deposit: 30000, count: 4, percentage: 0.005 },
    { deposit: 50000, count: 6, percentage: 0.01 },
    { deposit: 70000, count: 8, percentage: 0.02 },
    { deposit: 100000, count: 10, percentage: 0.03 },
  ];

  if (amount < 5000) {
    return {
      depositBonus: 0,
      count: 0,
    };
  }

  const lowestTier = depositTiers
    .filter((tier) => tier.deposit <= amount)
    .reduce(
      (prev, curr) => (curr.deposit > prev.deposit ? curr : prev),
      depositTiers[0]
    );

  if (type === "package") {
    return {
      count: lowestTier.count,
    };
  } else if (type === "deposit") {
    const depositBonus = lowestTier.percentage * amount;

    return {
      depositBonus: depositBonus,
    };
  }
};
