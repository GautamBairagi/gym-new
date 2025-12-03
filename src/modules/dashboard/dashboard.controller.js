import { dashboardService } from "./dashboard.service.js";

export const getDashboardData = async (req, res, next) => {
  try {
    const data = await dashboardService();
    res.json({ success: true, dashboard: data });
  } catch (err) {
    next(err);
  }
}