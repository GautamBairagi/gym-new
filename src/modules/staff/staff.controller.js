


import {
  createStaffService,
  listStaffService,
  staffDetailService,
  updateStaffService,
  deleteStaffService,
} from "./staff.service.js";
import bcrypt from "bcryptjs";

export const createStaff = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      roleId,
      branchId,
      gender,
      dateOfBirth,
      joinDate,
      exitDate,
      profilePhoto,
    } = req.body;

    // logged in admin ID
    const adminId = req.user.id;

    if (!fullName || !email || !password || !roleId || !branchId || !gender || !dateOfBirth || !joinDate) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await createStaffService({
      fullName,
      email,
      phone,
      password: hashedPassword,
      roleId,
      branchId,
      adminId,         // 👈 important
      gender,
      dateOfBirth,
      joinDate,
      exitDate: exitDate || null,
      profilePhoto: profilePhoto || null,
    });

    res.json({
      success: true,
      message: "Staff created successfully",
      staff,
    });
  } catch (err) {
    next(err);
  }
};

export const listStaff = async (req, res, next) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const staff = await listStaffService(branchId);

    res.json({
      success: true,
      staff,
    });
  } catch (err) {
    next(err);
  }
};


export const staffDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const staff = await staffDetailService(id);

    // 🛑 Branch access security (Only for Admin)
    if (
      req.checkBranch &&                      // route flag enabled
      req.user.role === "Admin" &&            // logged user admin
      staff.branchId !== req.user.branchId    // cross-branch access
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied! You are not allowed to view staff of another branch.",
      });
    }

    res.json({
      success: true,
      staff,
    });
  } catch (err) {
    next(err);
  }
};


export const updateStaff = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // logged admin updating → update adminId also (optional)
    data.adminId = req.user.id;

    const staff = await updateStaffService(id, data);

    res.json({
      success: true,
      message: "Staff updated successfully",
      staff,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteStaff = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await deleteStaffService(id);

    res.json({
      success: true,
      message: "Staff deactivated successfully",
    });
  } catch (err) {
    next(err);
  }
};
