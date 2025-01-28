import type { Context, Next } from "hono";
import {
  claimPackagePutSchema,
  createPackagePostSchema,
  packagePostSchema,
  updatePackageSchema,
} from "../../schema/schema.js";
import { sendErrorResponse } from "../../utils/function.js";
import prisma from "../../utils/prisma.js";
import {
  protectionAdmin,
  protectionMemberUser,
} from "../../utils/protection.js";
import { rateLimit } from "../../utils/redis.js";
import { supabaseClient } from "../../utils/supabase.js";

export const packagePostMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const supabase = supabaseClient;

  const user = await supabase.auth.getUser(token);

  if (user.error) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const response = await protectionMemberUser(user.data.user.id, prisma);

  if (response instanceof Response) {
    return response;
  }

  const { teamMemberProfile } = response;

  if (!teamMemberProfile) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${teamMemberProfile.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    return sendErrorResponse("Too Many Requests", 429);
  }

  const { amount, packageId } = await c.req.json();

  const { success } = packagePostSchema.safeParse({ amount, packageId });

  if (!success) {
    return c.json({ message: "Invalid request" }, 400);
  }

  c.set("teamMemberProfile", teamMemberProfile);

  await next();
};

export const packageGetMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const supabase = supabaseClient;

  const user = await supabase.auth.getUser(token);

  if (user.error) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const response = await protectionMemberUser(user.data.user.id, prisma);

  if (response instanceof Response) {
    return response;
  }

  const { teamMemberProfile } = response;

  if (!teamMemberProfile) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${teamMemberProfile.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    return sendErrorResponse("Too Many Requests", 429);
  }

  c.set("teamMemberProfile", teamMemberProfile);

  await next();
};

export const packageCreatePostMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const supabase = supabaseClient;

  const user = await supabase.auth.getUser(token);

  if (user.error) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const response = await protectionAdmin(user.data.user.id, prisma);

  if (response instanceof Response) {
    return response;
  }

  const { teamMemberProfile } = response;

  if (!teamMemberProfile) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${teamMemberProfile.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    return sendErrorResponse("Too Many Requests", 429);
  }

  const {
    packageName,
    packageDescription,
    packagePercentage,
    packageDays,
    packageColor,
    packageImage,
  } = await c.req.json();

  const validation = createPackagePostSchema.safeParse({
    packageName,
    packageDescription,
    packagePercentage,
    packageDays,
    packageColor,
    packageImage,
  });

  if (!validation.success) {
    return sendErrorResponse("Invalid request", 400);
  }

  await next();
};

export const packageUpdatePutMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const supabase = supabaseClient;

  const user = await supabase.auth.getUser(token);

  if (user.error) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const response = await protectionAdmin(user.data.user.id, prisma);

  if (response instanceof Response) {
    return response;
  }

  const { teamMemberProfile } = response;

  if (!teamMemberProfile) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${teamMemberProfile.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    return sendErrorResponse("Too Many Requests", 429);
  }

  const {
    packageName,
    packageDescription,
    packagePercentage,
    packageDays,
    packageIsDisabled,
    packageColor,
    package_image,
  } = await c.req.json();

  const id = c.req.param("id");

  const validation = updatePackageSchema.safeParse({
    packageName,
    packageDescription,
    packagePercentage,
    packageDays,
    packageIsDisabled,
    packageColor,
    package_image,
    packageId: id,
  });

  if (!validation.success) {
    return sendErrorResponse("Invalid request", 400);
  }

  await next();
};

export const packagesClaimPostMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header("Authorization")?.split("Bearer ")[1];

  if (!token) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const supabase = supabaseClient;

  const user = await supabase.auth.getUser(token);

  if (user.error) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const response = await protectionMemberUser(user.data.user.id, prisma);

  if (response instanceof Response) {
    return response;
  }

  const { teamMemberProfile } = response;

  if (!teamMemberProfile) {
    return sendErrorResponse("Unauthorized", 401);
  }

  const isAllowed = await rateLimit(
    `rate-limit:${teamMemberProfile.alliance_member_id}`,
    10,
    60
  );

  if (!isAllowed) {
    return sendErrorResponse("Too Many Requests", 429);
  }

  const { amount, earnings, packageConnectionId } = await c.req.json();

  const validation = claimPackagePutSchema.safeParse({
    amount,
    earnings,
    packageConnectionId,
  });

  if (!validation.success) {
    return sendErrorResponse("Invalid request", 400);
  }

  c.set("teamMemberProfile", teamMemberProfile);

  await next();
};
