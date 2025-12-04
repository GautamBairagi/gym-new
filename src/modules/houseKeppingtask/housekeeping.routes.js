import express from "express";
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByStaff
} from "./housekeeping.controller.js";

const router = express.Router();

router.post("/create", createTask);
router.get("/all", getAllTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

// filter by staff
router.get("/staff/:staffId", getTasksByStaff);

export default router;
