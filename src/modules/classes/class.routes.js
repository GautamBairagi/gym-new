import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.js";

import {
  createClassType,
  listClassTypes,
  createSchedule,
  listSchedules,
  bookClass,
  cancelBooking,
  memberBookings,
  getAllScheduledClasses,
  getScheduleById,
  updateSchedule,
  deleteSchedule
} from "./class.controller.js";

const router = Router();

router.put("/scheduled/update/:id", verifyToken(["Admin", "Superadmin", "Staff"]), updateSchedule);
router.delete("/scheduled/delete/:id", verifyToken(["Admin", "Superadmin", "Staff"]), deleteSchedule);

router.get("/scheduled/all", verifyToken(["Admin", "Superadmin", "Staff"]), getAllScheduledClasses);
router.get("/scheduled/scheduledById/:id", verifyToken(["Admin", "Superadmin", "Staff"]), getScheduleById);

// CLASS TYPES
router.post(
  "/classtype/create",
  verifyToken(["Admin", "Superadmin"]),
  createClassType
);

router.get(
  "/classtype",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  listClassTypes
);

// CLASS SCHEDULE
router.post(
  "/schedule/create",
  verifyToken(["Admin", "Superadmin"]),
  createSchedule
);

router.get(
  "/schedule/branch/:branchId",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  listSchedules
);

// BOOKING
router.post(
  "/book",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  bookClass
);

router.post(
  "/cancel",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  cancelBooking
);

router.get(
  "/member/:memberId",
  verifyToken(["Admin", "Superadmin", "Staff"]),
  memberBookings
);



export default router;
