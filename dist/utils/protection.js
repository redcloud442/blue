import { sendErrorResponse } from "./function.js";
export const protectionMemberUser = async (userId, prisma) => {
    try {
        const user = await prisma.user_table.findUnique({
            where: { user_id: userId },
            include: {
                alliance_member_table: true,
            },
        });
        if (!user) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        if (!user?.alliance_member_table?.[0]?.alliance_member_alliance_id ||
            ![
                "MEMBER",
                "MERCHANT",
                "ACCOUNTING",
                "ADMIN",
                "ACCOUNTING_HEAD",
            ].includes(user.alliance_member_table[0].alliance_member_role)) {
            return sendErrorResponse("Unauthorized", 401);
        }
        if (user.alliance_member_table[0].alliance_member_restricted) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        return {
            teamMemberProfile: user.alliance_member_table[0],
        };
    }
    catch (e) {
        return sendErrorResponse("Internal Server Error", 500);
    }
};
export const protectionMerchantAdmin = async (userId, prisma) => {
    try {
        const user = await prisma.user_table.findUnique({
            where: { user_id: userId },
            include: {
                alliance_member_table: true,
            },
        });
        if (!user) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        if (!user?.alliance_member_table?.[0]?.alliance_member_alliance_id ||
            !["MERCHANT", "ADMIN"].includes(user?.alliance_member_table?.[0]?.alliance_member_role)) {
            return sendErrorResponse("Unauthorized", 401);
        }
        if (user.alliance_member_table[0].alliance_member_restricted) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        return {
            teamMemberProfile: user.alliance_member_table[0],
        };
    }
    catch (e) {
        return sendErrorResponse("Internal Server Error", 500);
    }
};
export const protectionAccountingAdmin = async (userId, prisma) => {
    try {
        const user = await prisma.user_table.findUnique({
            where: { user_id: userId },
            include: {
                alliance_member_table: true,
            },
        });
        if (!user) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        if (!user?.alliance_member_table?.[0]?.alliance_member_alliance_id ||
            !["ACCOUNTING", "ADMIN", "ACCOUNTING_HEAD"].includes(user?.alliance_member_table?.[0]?.alliance_member_role)) {
            return sendErrorResponse("Unauthorized", 401);
        }
        if (user.alliance_member_table[0].alliance_member_restricted) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        return {
            teamMemberProfile: user.alliance_member_table[0],
        };
    }
    catch (e) {
        return sendErrorResponse("Internal Server Error", 500);
    }
};
export const protectionAdmin = async (userId, prisma) => {
    try {
        const user = await prisma.user_table.findUnique({
            where: { user_id: userId },
            include: {
                alliance_member_table: true,
            },
        });
        if (!user) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        if (!user?.alliance_member_table?.[0]?.alliance_member_alliance_id ||
            !["ADMIN"].includes(user?.alliance_member_table?.[0]?.alliance_member_role)) {
            return sendErrorResponse("Unauthorized", 401);
        }
        if (user.alliance_member_table[0].alliance_member_restricted) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        return {
            teamMemberProfile: user.alliance_member_table[0],
        };
    }
    catch (e) {
        return sendErrorResponse("Internal Server Error", 500);
    }
};
export const protectionMerchantAdminAccounting = async (userId, prisma) => {
    try {
        const user = await prisma.user_table.findUnique({
            where: { user_id: userId },
            include: {
                alliance_member_table: true,
            },
        });
        if (!user) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        if (!user?.alliance_member_table?.[0]?.alliance_member_alliance_id ||
            !["MERCHANT", "ACCOUNTING", "ADMIN"].includes(user.alliance_member_table[0].alliance_member_role)) {
            return sendErrorResponse("Unauthorized", 401);
        }
        if (user.alliance_member_table[0].alliance_member_restricted) {
            return sendErrorResponse("Internal Server Error", 500);
        }
        return {
            teamMemberProfile: user.alliance_member_table[0],
        };
    }
    catch (e) {
        return sendErrorResponse("Internal Server Error", 500);
    }
};
