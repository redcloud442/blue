import {
  Prisma,
  type alliance_member_table,
  type Role,
  type user_table,
} from "@prisma/client";
import { getPhilippinesTime } from "../../utils/function.js";
import type { UserRequestdata } from "../../utils/types.js";

import bcryptjs from "bcryptjs";
import prisma from "../../utils/prisma.js";
import { redis } from "../../utils/redis.js";
import { supabaseClient } from "../../utils/supabase.js";

export const userModelPut = async (params: {
  userId: string;
  email: string;
  password: string;
}) => {
  const { userId, email, password } = params;

  const user = await prisma.user_table.findFirst({
    where: {
      user_email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const userCompare = await bcryptjs.compare(password, user?.user_password);

  if (!userCompare) {
    return { success: false, error: "Invalid request." };
  }

  const teamMemberProfile = await prisma.alliance_member_table.findFirst({
    where: { alliance_member_user_id: user?.user_id },
  });

  if (!teamMemberProfile) {
    return { success: false, error: "Invalid request." };
  }

  if (
    teamMemberProfile.alliance_member_restricted ||
    !teamMemberProfile.alliance_member_alliance_id
  ) {
    return { success: false, error: "Access restricted" };
  }

  prisma.user_table.update({
    where: {
      user_id: userId,
    },
    data: {
      user_password: password,
    },
  });

  if (teamMemberProfile?.alliance_member_role !== "ADMIN") {
    const supabase = supabaseClient;
    const { error } = await supabase.auth.updateUser({
      email: email,
      password: password,
    });
    if (error) {
      return { success: false, error: "Failed to update user password" };
    }
  } else {
    const supabase = supabaseClient;
    await supabase.auth.admin.updateUserById(userId, {
      password: password,
    });
  }

  return { success: true, message: "Password updated successfully" };
};

export const userModelPost = async (params: { memberId: string }) => {
  const { memberId } = params;

  const user = await prisma.dashboard_earnings_summary.findUnique({
    where: {
      member_id: memberId,
    },
    select: {
      direct_referral_amount: true,
      indirect_referral_amount: true,
      total_earnings: true,
      total_withdrawals: true,
      direct_referral_count: true,
      indirect_referral_count: true,
    },
  });

  const userEarnings = await prisma.alliance_earnings_table.findUnique({
    where: {
      alliance_earnings_member_id: memberId,
    },
    select: {
      alliance_olympus_wallet: true,
      alliance_olympus_earnings: true,
      alliance_combined_earnings: true,
      alliance_referral_bounty: true,
      alliance_winning_earnings: true,
    },
  });

  const totalEarnings = {
    directReferralAmount: user?.direct_referral_amount,
    indirectReferralAmount: user?.indirect_referral_amount,
    totalEarnings: user?.total_earnings,
    winningEarnings: userEarnings?.alliance_winning_earnings,
    withdrawalAmount: user?.total_withdrawals,
    directReferralCount: user?.direct_referral_count,
    indirectReferralCount: user?.indirect_referral_count,
  };

  return { totalEarnings, userEarningsData: userEarnings };
};

export const userModelGet = async (params: { memberId: string }) => {
  const { memberId } = params;

  let canWithdrawPackage = false;
  let canWithdrawReferral = false;
  let canWithdrawWinning = false;
  let canUserDeposit = false;
  const todayStart = getPhilippinesTime(new Date(), "start");

  const todayEnd = getPhilippinesTime(new Date(), "end");

  const existingPackageWithdrawal =
    await prisma.alliance_withdrawal_request_table.findFirst({
      where: {
        alliance_withdrawal_request_member_id: memberId,
        alliance_withdrawal_request_status: {
          in: ["PENDING", "APPROVED"],
        },

        alliance_withdrawal_request_withdraw_type: "PACKAGE",
        alliance_withdrawal_request_date: {
          gte: todayStart, // Start of the day
          lte: todayEnd, // End of the day
        },
      },
    });

  const existingReferralWithdrawal =
    await prisma.alliance_withdrawal_request_table.findFirst({
      where: {
        alliance_withdrawal_request_member_id: memberId,
        alliance_withdrawal_request_status: {
          in: ["PENDING", "APPROVED"],
        },
        alliance_withdrawal_request_withdraw_type: "REFERRAL",
        alliance_withdrawal_request_date: {
          gte: getPhilippinesTime(new Date(new Date()), "start"),
          lte: getPhilippinesTime(new Date(new Date()), "end"),
        },
      },
    });

  const existingWinningWithdrawal =
    await prisma.alliance_withdrawal_request_table.findFirst({
      where: {
        alliance_withdrawal_request_member_id: memberId,

        alliance_withdrawal_request_status: {
          in: ["PENDING", "APPROVED"],
        },
        alliance_withdrawal_request_withdraw_type: "WINNING",
        alliance_withdrawal_request_date: {
          gte: getPhilippinesTime(new Date(new Date()), "start"),
          lte: getPhilippinesTime(new Date(new Date()), "end"),
        },
      },
    });

  if (existingPackageWithdrawal !== null) {
    canWithdrawPackage = true;
  }

  if (existingReferralWithdrawal !== null) {
    canWithdrawReferral = true;
  }

  if (existingWinningWithdrawal !== null) {
    canWithdrawWinning = true;
  }

  const existingDeposit = await prisma.alliance_top_up_request_table.findFirst({
    where: {
      alliance_top_up_request_member_id: memberId,
      alliance_top_up_request_status: "PENDING",
    },
    take: 1,
    orderBy: {
      alliance_top_up_request_date: "desc",
    },
  });

  if (existingDeposit !== null) {
    canUserDeposit = true;
  }

  const wheelLog = await prisma.alliance_wheel_log_table.upsert({
    where: {
      alliance_wheel_member_id: memberId,
    },
    update: {},
    create: {
      alliance_wheel_member_id: memberId,
    },
  });

  const dailyTask = await prisma.alliance_wheel_table.upsert({
    where: {
      alliance_wheel_date_alliance_wheel_member_id: {
        alliance_wheel_date: todayStart,
        alliance_wheel_member_id: memberId,
      },
    },
    update: {},
    create: {
      alliance_wheel_date: todayStart,
      alliance_wheel_member_id: memberId,
    },
  });

  const response = {
    wheelLog,
    dailyTask,
  };

  const data = {
    canWithdrawPackage,
    canWithdrawReferral,
    canWithdrawWinning,
    canUserDeposit,
    response,
  };

  return { data };
};

export const userPatchModel = async (params: {
  memberId: string;
  action: string;
  role: Role;
  type: string;
}) => {
  const { memberId, action, role, type } = params;

  if (action === "updateRole") {
    await prisma.alliance_member_table.update({
      where: { alliance_member_id: memberId },
      data: {
        alliance_member_role: role,
        alliance_member_date_updated: new Date(),
        alliance_member_is_active:
          role &&
          ["ADMIN", "MERCHANT", "ACCOUNTING"].some((r) => role.includes(r))
            ? true
            : undefined, // Stay as is if no role is included
      },
    });

    if (role === "ADMIN" || role === "ACCOUNTING" || role === "MERCHANT") {
      await prisma.alliance_earnings_table.upsert({
        where: {
          alliance_earnings_member_id: memberId,
        },
        update: {},
        create: {
          alliance_earnings_member_id: memberId,
        },
      });
    }

    if (role === "MERCHANT") {
      await prisma.merchant_member_table.create({
        data: {
          merchant_member_merchant_id: memberId,
        },
      });
    }

    return {
      success: true,
      message: "User role updated successfully.",
    };
  }

  if (action === "banUser") {
    if (type === "BAN") {
      const supabase = supabaseClient;

      const user = await prisma.alliance_member_table.findUnique({
        where: { alliance_member_id: memberId },
        select: {
          alliance_member_user_id: true,
        },
      });

      if (!user) {
        return { success: false, error: "User not found." };
      }

      const { error } = await supabase.auth.admin.updateUserById(
        user.alliance_member_user_id,
        {
          ban_duration: "100000h",
        }
      );

      if (error) throw error;

      await prisma.alliance_member_table.update({
        where: { alliance_member_id: memberId },
        data: { alliance_member_restricted: true },
      });
    } else if (type === "UNBAN") {
      const supabase = supabaseClient;
      const user = await prisma.alliance_member_table.findUnique({
        where: { alliance_member_id: memberId },
        select: {
          alliance_member_user_id: true,
        },
      });

      if (!user) {
        return { success: false, error: "User not found." };
      }

      const { error } = await supabase.auth.admin.updateUserById(
        user.alliance_member_user_id,
        {
          ban_duration: "none",
        }
      );

      if (error) throw error;

      await prisma.alliance_member_table.update({
        where: { alliance_member_id: memberId },
        data: { alliance_member_restricted: false },
      });
    }

    return {
      success: true,
      message: "User banned successfully.",
    };
  }
};

export const userSponsorModel = async (params: { userId: string }) => {
  const { userId } = params;

  const user: { user_username: string }[] = await prisma.$queryRaw`
  SELECT
        ut2.user_username
      FROM user_schema.user_table ut
      JOIN alliance_schema.alliance_member_table am
        ON am.alliance_member_user_id = ut.user_id
      JOIN alliance_schema.alliance_referral_table art
        ON art.alliance_referral_member_id = am.alliance_member_id
      JOIN alliance_schema.alliance_member_table am2
        ON am2.alliance_member_id = art.alliance_referral_from_member_id
      JOIN user_schema.user_table ut2
        ON ut2.user_id = am2.alliance_member_user_id
      WHERE ut.user_id = ${userId}::uuid
  `;

  if (!user) {
    return { success: false, error: "User not found." };
  }

  return user[0].user_username;
};

export const userProfileModelPut = async (params: {
  profilePicture: string;
  userId: string;
}) => {
  const { profilePicture, userId } = params;
  await prisma.$transaction(async (tx) => {
    await tx.user_table.update({
      where: { user_id: userId },
      data: { user_profile_picture: profilePicture },
    });
  });
};

export const userGenerateLinkModel = async (params: {
  formattedUserName: string;
}) => {
  const { formattedUserName } = params;

  const { data, error } = await supabaseClient.auth.admin.generateLink({
    type: "magiclink",
    email: formattedUserName,
  });

  if (error) throw error;

  return data.properties;
};

export const userListModel = async (
  params: {
    page: number;
    limit: number;
    search: string;
    columnAccessor: string;
    isAscendingSort: boolean;
    userRole?: string;
    dateCreated?: string;
    bannedUser?: boolean;
  },
  teamMemberProfile: alliance_member_table
) => {
  const {
    page,
    limit,
    search,
    columnAccessor,
    isAscendingSort,
    userRole,
    dateCreated,
    bannedUser,
  } = params;

  const offset = (page - 1) * limit;

  const whereCondition: any = {
    alliance_member_alliance_id: teamMemberProfile.alliance_member_alliance_id,
  };

  if (search) {
    whereCondition.OR = [
      {
        user_table: {
          user_username: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        user_table: {
          user_first_name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
      {
        user_table: {
          user_last_name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (userRole !== "") {
    whereCondition.alliance_member_role = userRole;
  }

  if (dateCreated) {
    whereCondition.user_table = {
      user_date_created: {
        gte: new Date(dateCreated),
        lte: new Date(dateCreated),
      },
    };
  }

  if (bannedUser) {
    whereCondition.alliance_member_restricted = true;
  }

  let orderByCondition = {};

  if (columnAccessor) {
    if (columnAccessor.startsWith("user")) {
      orderByCondition = {
        user_table: {
          [columnAccessor]: isAscendingSort ? "desc" : "asc",
        },
      };
    } else {
      orderByCondition = {
        [columnAccessor]: isAscendingSort ? "desc" : "asc",
      };
    }
  }

  const userRequest = await prisma.alliance_member_table.findMany({
    where: whereCondition,
    include: {
      user_table: true,
      merchant_member_table: true,
    },
    orderBy: orderByCondition,
    take: limit,
    skip: offset,
  });

  const totalCount = await prisma.alliance_member_table.count({
    where: whereCondition,
  });

  const formattedData: UserRequestdata[] = userRequest.map((entry) => ({
    alliance_member_id: entry.alliance_member_id,
    alliance_member_role: entry.alliance_member_role,
    alliance_member_date_created:
      entry.alliance_member_date_created.toISOString(),
    alliance_member_alliance_id: entry.alliance_member_alliance_id,
    alliance_member_user_id: entry.alliance_member_user_id,
    alliance_member_restricted: entry.alliance_member_restricted,
    alliance_member_date_updated:
      entry.alliance_member_date_updated?.toISOString() || "",
    alliance_member_is_active: entry.alliance_member_is_active,
    user_id: entry.user_table.user_id,
    user_username: entry.user_table.user_username || "",
    user_first_name: entry.user_table.user_first_name || "",
    user_last_name: entry.user_table.user_last_name || "",
    user_date_created: entry.user_table.user_date_created.toISOString(),
  }));

  return {
    totalCount,
    data: formattedData,
  };
};

export const userActiveListModel = async (params: {
  page: number;
  limit: number;
  search: string;
  columnAccessor: string;
  isAscendingSort: boolean;
}) => {
  const { page, limit, search, columnAccessor, isAscendingSort } = params;

  const offset = (page - 1) * limit;

  const sortBy = isAscendingSort ? "ASC" : "DESC";

  const orderBy = columnAccessor
    ? Prisma.sql`ORDER BY ${Prisma.raw(columnAccessor)} ${Prisma.raw(sortBy)}`
    : Prisma.empty;
  const searchCondition = search
    ? Prisma.sql`
        AND (
          ut.user_username ILIKE ${`%${search}%`} OR
          ut.user_first_name ILIKE ${`%${search}%`} OR
          ut.user_last_name ILIKE ${`%${search}%`}
        )
      `
    : Prisma.empty;

  const usersWithActiveWallet: user_table[] = await prisma.$queryRaw`
    SELECT
      ut.user_id,
      ut.user_username,
      ut.user_first_name,
      ut.user_last_name,
      am.alliance_member_is_active
    FROM user_schema.user_table ut
    JOIN alliance_schema.alliance_member_table am
      ON ut.user_id = am.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_earnings_table ae
      ON ae.alliance_earnings_member_id = am.alliance_member_id
    WHERE
      ae.alliance_olympus_wallet > 0
      ${searchCondition}
      ${orderBy}
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const totalCount: { count: bigint }[] = await prisma.$queryRaw`
    SELECT
      COUNT(*)
    FROM user_schema.user_table ut
    JOIN alliance_schema.alliance_member_table am
      ON ut.user_id = am.alliance_member_user_id
    LEFT JOIN alliance_schema.alliance_earnings_table ae
      ON ae.alliance_earnings_member_id = am.alliance_member_id
      WHERE
      ae.alliance_olympus_wallet > 0
      ${searchCondition}
    `;

  return {
    data: usersWithActiveWallet,
    totalCount: Number(totalCount[0]?.count ?? 0),
  };
};

export const userChangePasswordModel = async (params: {
  password: string;
  userId: string;
}) => {
  const { password, userId } = params;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user_table.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await tx.user_table.update({
      where: { user_id: userId },
      data: { user_password: hashedPassword },
    });

    await supabaseClient.auth.admin.updateUserById(userId, {
      password: password,
    });
  });
};

export const userListReinvestedModel = async (params: {
  dateFilter: {
    start: string;
    end: string;
  };
  take: number;
  skip: number;
}) => {
  const { dateFilter, take, skip } = params;

  const offset = (skip - 1) * take;

  const startDate = dateFilter.start
    ? new Date(
        getPhilippinesTime(new Date(dateFilter.start), "start")
      ).toISOString()
    : getPhilippinesTime(new Date(), "start");

  const endDate = dateFilter.end
    ? getPhilippinesTime(new Date(dateFilter.end), "end")
    : getPhilippinesTime(new Date(), "end");

  const data: {
    package_member_member_id: string;
    package_member_amount: number;
    package_member_connection_created: Date;
    package_member_status: string;
    user_username: string;
    user_first_name: string;
    user_last_name: string;
  }[] = await prisma.$queryRaw`
        SELECT
          pml.package_member_member_id,
          pml.package_member_amount,
          pml.package_member_connection_created,
          pml.package_member_status,
          u.user_username,
          u.user_first_name,
          u.user_last_name
      FROM packages_schema.package_member_connection_table pml
      JOIN packages_schema.package_earnings_log pol
          ON pol.package_member_member_id = pml.package_member_member_id
      JOIN alliance_schema.alliance_member_table am
          ON am.alliance_member_id = pml.package_member_member_id
      JOIN user_schema.user_table u
          ON u.user_id = am.alliance_member_user_id
      WHERE pml.package_member_is_reinvestment = true AND pml.package_member_connection_created::timestamptz
          BETWEEN ${new Date(
            startDate || new Date()
          ).toISOString()}::timestamptz AND ${new Date(
    endDate || new Date()
  ).toISOString()}::timestamptz
      GROUP BY
          pml.package_member_member_id,
          pml.package_member_amount,
          pml.package_member_connection_created,
          pml.package_member_status,
          u.user_username,
          u.user_first_name,
          u.user_last_name
      ORDER BY pml.package_member_connection_created DESC
      LIMIT ${take}
      OFFSET ${offset}
`;
  const totalCount: { count: number }[] = await prisma.$queryRaw`
      SELECT COUNT(*)::INTEGER AS count
      FROM (
          SELECT
              pml.package_member_member_id
          FROM packages_schema.package_member_connection_table pml
          JOIN packages_schema.package_earnings_log pol
          ON pol.package_member_member_id = pml.package_member_member_id
          JOIN alliance_schema.alliance_member_table am
              ON am.alliance_member_id = pml.package_member_member_id
          JOIN user_schema.user_table u
              ON u.user_id = am.alliance_member_user_id
          WHERE pml.package_member_is_reinvestment = true
            AND pml.package_member_connection_created::timestamptz
          BETWEEN ${new Date(
            startDate || new Date()
          ).toISOString()}::timestamptz AND ${new Date(
    endDate || new Date()
  ).toISOString()}::timestamptz
          GROUP BY
            pml.package_member_member_id,
            pml.package_member_amount,
            pml.package_member_connection_created,
            pml.package_member_status,
            u.user_username,
            u.user_first_name,
            u.user_last_name
      ) AS total_count
  `;

  return { data, totalCount: Number(totalCount[0]?.count ?? 0) };
};

export const userTreeModel = async (params: { memberId: string }) => {
  const { memberId } = params;

  const cacheKey = `referral-tree-${memberId}`;

  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  const userTree = await prisma.alliance_referral_table.findUnique({
    where: { alliance_referral_member_id: memberId },
    select: {
      alliance_referral_hierarchy: true,
    },
  });

  if (!userTree || !userTree.alliance_referral_hierarchy) {
    return { success: false, error: "User not found" };
  }

  const rawHierarchy = userTree.alliance_referral_hierarchy.split(".");

  const orderedHierarchy = [
    memberId,
    ...rawHierarchy.filter((id) => id !== memberId).reverse(),
  ];

  // Fetch user data from alliance_member_table
  const userTreeData = await prisma.alliance_member_table.findMany({
    where: { alliance_member_id: { in: orderedHierarchy } },
    select: {
      alliance_member_id: true,
      user_table: {
        select: {
          user_username: true,
          user_id: true,
        },
      },
    },
  });

  const formattedUserTreeData = orderedHierarchy
    .map((id) => {
      const user = userTreeData.find((user) => user.alliance_member_id === id);
      return user
        ? {
            alliance_member_id: user.alliance_member_id,
            user_id: user.user_table.user_id,
            user_username: user.user_table.user_username,
          }
        : null;
    })
    .filter(Boolean);

  await redis.set(cacheKey, JSON.stringify(formattedUserTreeData), {
    ex: 60 * 60 * 24 * 30,
  });

  return formattedUserTreeData;
};

export const userGetSearchModel = async (params: { userName: string }) => {
  const { userName } = params;

  const users = await prisma.user_table.findMany({
    where: {
      user_username: {
        contains: userName,
        mode: "insensitive",
      },
    },
    select: {
      user_id: true,
      user_username: true,
      user_first_name: true,
      user_last_name: true,
      alliance_member_table: {
        select: {
          alliance_member_id: true,
          alliance_member_is_active: true,
          alliance_member_role: true,
          alliance_member_restricted: true,
        },
      },
    },
  });

  if (!users || users.length === 0) {
    return { data: [] };
  }

  const formattedUsers = users.flatMap((user) =>
    user.alliance_member_table.map((member) => ({
      user_id: user.user_id,
      alliance_member_id: member.alliance_member_id,
      user_username: user.user_username,
      user_first_name: user.user_first_name,
      user_last_name: user.user_last_name,
      alliance_member_is_active: member.alliance_member_is_active,
      alliance_member_role: member.alliance_member_role,
      alliance_member_restricted: member.alliance_member_restricted,
    }))
  );

  return { data: formattedUsers };
};

export const userReferralModel = async (params: {
  memberId: string;
  dateFilter: {
    start: string;
    end: string;
  };
}) => {
  const { memberId, dateFilter } = params;

  // Aggregate Direct and Indirect referrals separately
  const referrals = await prisma.package_ally_bounty_log.groupBy({
    by: ["package_ally_bounty_type"],
    where: {
      package_ally_bounty_member_id: memberId,
      package_ally_bounty_log_date_created: {
        gte: getPhilippinesTime(new Date(dateFilter.start), "start"),
        lte: getPhilippinesTime(new Date(dateFilter.end), "end"),
      },
    },
    _sum: { package_ally_bounty_earnings: true },
  });

  // Convert the result into an object with direct & indirect earnings
  const result = {
    directReferral: 0,
    indirectReferral: 0,
  };

  referrals.forEach((entry) => {
    if (entry.package_ally_bounty_type === "DIRECT") {
      result.directReferral = entry._sum.package_ally_bounty_earnings || 0;
    } else if (entry.package_ally_bounty_type === "INDIRECT") {
      result.indirectReferral = entry._sum.package_ally_bounty_earnings || 0;
    }
  });
  return result;
};
