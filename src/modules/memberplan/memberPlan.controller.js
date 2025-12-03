import {
  saveMemberPlan,
  getAllMemberPlans,
getMemberPlansByAdminIdService,
  getMemberPlanById,
  updateMemberPlan,
  deleteMemberPlan,
} from "../memberplan/memberPlan.service.js";

export const createMemberPlan = async (req, res, next) => {
  try {
    const data = await saveMemberPlan(req.body);
    res.json({ success: true, plan: data });
  } catch (err) {
    next(err);
  }
};

export const getMemberPlans = async (req, res, next) => { 
  try {
    const adminId = req.user?.id || req.query.adminId;
    if (!adminId) throw { status: 400, message: "adminId is required" };

    const plans = await getMemberPlansByAdminIdService(adminId);
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};






export const getMemberPlansnewss = async () => {
  return await prisma.memberPlan.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};



// 🔹 GET: /api/memberplan/2  => single plan by id
export const getMemberPlan = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await getMemberPlanById(id);

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    }

    res.json({ success: true, plan: data });
  } catch (err) {
    next(err);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const data = await updateMemberPlan(Number(req.params.id), req.body, adminId);

    res.json({
      success: true,
      message: "Plan updated successfully",
      plan: data
    });
  } catch (err) {
    next(err);
  }
};

export const deletePlan = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    await deleteMemberPlan(Number(req.params.id), adminId);

    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (err) {
    next(err);
  }
};
