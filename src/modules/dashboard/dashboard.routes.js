import { Router } from "express";
// import { verifyToken } from "../../middlewares/auth.js";
import { getDashboardData } from "./dashboard.controller.js";

const router = Router();

router.get("/",  getDashboardData);

export default router;
