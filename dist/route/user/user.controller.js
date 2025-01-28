import { userModelGet, userModelPost, userModelPut, userPatchModel, userProfileModelPut, userSponsorModel, } from "./user.model.js";
export const userPutController = async (c) => {
    try {
        const { email, password, userId } = await c.req.json();
        await userModelPut({ email, password, userId });
        return c.json({ message: "User Updated" });
    }
    catch (error) {
        console.log(error);
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
export const userPostController = async (c) => {
    try {
        const { memberId } = await c.req.json();
        const user = await userModelPost({ memberId });
        return c.json(user);
    }
    catch (error) {
        console.log(error);
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
export const userGetController = async (c) => {
    try {
        const teamMemberProfile = c.get("teamMemberProfile");
        const isWithdrawalToday = await userModelGet({
            memberId: teamMemberProfile.alliance_member_id,
        });
        return c.json(isWithdrawalToday);
    }
    catch (error) {
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
export const userPatchController = async (c) => {
    try {
        const { action, role } = await c.req.json();
        const { id } = c.req.param();
        await userPatchModel({ memberId: id, action, role });
        return c.json({ message: "User Updated" });
    }
    catch (error) {
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
export const userSponsorController = async (c) => {
    try {
        const { userId } = await c.req.json();
        const data = await userSponsorModel({ userId });
        return c.json({ data });
    }
    catch (error) {
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
export const userProfilePutController = async (c) => {
    try {
        const { profilePicture } = await c.req.json();
        const { id } = c.req.param();
        await userProfileModelPut({ profilePicture, userId: id });
        return c.json({ message: "Profile Updated" });
    }
    catch (error) {
        return c.json({ error: "Internal Server Error" }, { status: 500 });
    }
};
