import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";
import {
  createDietPlan,
  assignDietPlan,
  getMemberDietPlan
} from "./diet.controller.js";

const router = Router();

// Only trainer, admin, superadmin can create
router.post("/create", verifyToken(["Staff", "Admin", "Superadmin"]), createDietPlan);

// Assign diet plan to member
router.post("/assign", verifyToken(["Staff", "Admin", "Superadmin"]), assignDietPlan);

// Member diet history
router.get("/member/:memberId", verifyToken(["Staff", "Admin", "Superadmin"]), getMemberDietPlan);

export default router;
