import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";
import { getDashboardData } from "./dashboard.controller.js";

const router = Router();

router.get("/", verifyToken(["Superadmin", "Admin"]), getDashboardData);

export default router;
