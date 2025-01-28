import { depositHistoryPostSchema, depositSchema, updateDepositSchema, } from "../../schema/schema.js";
import { sendErrorResponse } from "../../utils/function.js";
import prisma from "../../utils/prisma.js";
import { protectionMemberUser, protectionMerchantAdmin, } from "../../utils/protection.js";
import { rateLimit } from "../../utils/redis.js";
import { supabaseClient } from "../../utils/supabase.js";
export const depositMiddleware = async (c, next) => {
    const token = c.req.header("Authorization")?.split("Bearer ")[1];
    if (!token) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const supabase = supabaseClient;
    const user = await supabase.auth.getUser(token);
    if (user.error) {
        return null;
    }
    const response = await protectionMemberUser(user.data.user.id, prisma);
    if (response instanceof Response) {
        return response;
    }
    const { teamMemberProfile } = response;
    if (!teamMemberProfile) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${teamMemberProfile.alliance_member_id}`, 10, 60);
    if (!isAllowed) {
        return sendErrorResponse("Too Many Requests", 429);
    }
    const { TopUpFormValues } = await c.req.json();
    const { amount, topUpMode, accountName, accountNumber } = TopUpFormValues;
    const sanitizedData = depositSchema.safeParse({
        amount,
        topUpMode,
        accountName,
        accountNumber,
    });
    if (!sanitizedData.success) {
        return sendErrorResponse("Invalid Request", 400);
    }
    c.set("teamMemberProfile", teamMemberProfile);
    return await next();
};
export const depositPutMiddleware = async (c, next) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const supabase = supabaseClient;
    const user = await supabase.auth.getUser(token);
    if (user.error) {
        return null;
    }
    const response = await protectionMerchantAdmin(user.data.user.id, prisma);
    if (response instanceof Response) {
        return response;
    }
    const { teamMemberProfile } = response;
    if (!teamMemberProfile) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${teamMemberProfile.alliance_member_id}`, 10, 60);
    if (!isAllowed) {
        return sendErrorResponse("Too Many Requests", 429);
    }
    const { id } = c.req.param();
    const { status, note } = await c.req.json();
    const sanitizedData = updateDepositSchema.safeParse({
        status,
        note,
        requestId: id,
    });
    if (!sanitizedData.success) {
        return sendErrorResponse("Invalid Request", 400);
    }
    c.set("teamMemberProfile", teamMemberProfile);
    c.set("sanitizedData", sanitizedData.data);
    return await next();
};
export const depositHistoryPostMiddleware = async (c, next) => {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const supabase = supabaseClient;
    const user = await supabase.auth.getUser(token);
    if (user.error) {
        return null;
    }
    const response = await protectionMerchantAdmin(user.data.user.id, prisma);
    if (response instanceof Response) {
        return response;
    }
    const { teamMemberProfile } = response;
    if (!teamMemberProfile) {
        return sendErrorResponse("Unauthorized", 401);
    }
    const isAllowed = await rateLimit(`rate-limit:${teamMemberProfile.alliance_member_id}`, 50, 60);
    if (!isAllowed) {
        return sendErrorResponse("Too Many Requests", 429);
    }
    const { search, page, sortBy, limit, columnAccessor, isAscendingSort, teamMemberId, userId, } = await c.req.json();
    const sanitizedData = depositHistoryPostSchema.safeParse({
        search,
        page,
        sortBy,
        limit,
        columnAccessor,
        isAscendingSort,
        teamMemberId,
        userId,
    });
    if (!sanitizedData.success) {
        return sendErrorResponse("Invalid Request", 400);
    }
    c.set("teamMemberProfile", teamMemberProfile);
    return await next();
};
