import type { Context } from "hono";
import { sendErrorResponse } from "../../utils/function.js";
import {
  updateWithdrawModel,
  withdrawHideUserModel,
  withdrawHistoryModel,
  withdrawHistoryReportPostModel,
  withdrawHistoryReportPostTotalModel,
  withdrawListExportPostModel,
  withdrawListPostModel,
  withdrawModel,
} from "./withdraw.model.js";

export const withdrawPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const teamMemberProfile = c.get("teamMemberProfile");

    await withdrawModel({
      ...params,
      teamMemberProfile,
    });

    return c.json({ message: "Withdrawal successful" }, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawHistoryPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const teamMemberProfile = c.get("teamMemberProfile");

    const data = await withdrawHistoryModel(params, teamMemberProfile);

    return c.json(data, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const updateWithdrawPostController = async (c: Context) => {
  try {
    const { status, note } = await c.req.json();

    const { id } = c.req.param();

    const teamMemberProfile = c.get("teamMemberProfile");

    await updateWithdrawModel({
      status,
      note,
      teamMemberProfile,
      requestId: id,
    });

    return c.json({ message: "Withdrawal updated" }, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawListPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const teamMemberProfile = c.get("teamMemberProfile");

    const data = await withdrawListPostModel({
      parameters: params,
      teamMemberProfile,
    });

    return c.json(data, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawHistoryReportPostController = async (c: Context) => {
  try {
    const { dateFilter } = await c.req.json();

    const data = await withdrawHistoryReportPostModel({ dateFilter });

    return c.json(data, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawTotalReportPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const data = await withdrawHistoryReportPostTotalModel(params);

    return c.json(data, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawHideUserPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const teamMemberProfile = c.get("teamMemberProfile");

    await withdrawHideUserModel({
      id: params.id,
      type: params.type,
      teamMemberProfile,
    });

    return c.json({ message: "User hidden" }, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};

export const withdrawListExportPostController = async (c: Context) => {
  try {
    const params = c.get("params");

    const teamMemberProfile = c.get("teamMemberProfile");

    const data = await withdrawListExportPostModel({
      parameters: params,
      teamMemberProfile,
    });

    return c.json(data, 200);
  } catch (e) {
    return sendErrorResponse("Internal Server Error", 500);
  }
};
