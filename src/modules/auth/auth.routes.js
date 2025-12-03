import { Router } from "express";
import {getDashboardStats, register, login,   getUserById, updateUser, deleteUser, getAdmins, loginMember } from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/member/login",loginMember);


router.get("/user/:id", getUserById);
router.put("/user/:id", updateUser);
router.delete("/user/:id", deleteUser);
router.get("/admins", getAdmins);
router.get("/dashboard", getDashboardStats);

export default router;
