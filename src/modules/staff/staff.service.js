// staff.service.js
import { pool } from "../../config/db.js";

/**************************************
 * CREATE STAFF
 **************************************/
export const createStaffService = async (data) => {
  const {
    fullName,
    email,
    phone,
    password,
    roleId,
    branchId,
    adminId,
    gender,
    dateOfBirth,
    joinDate,
    exitDate,
    profilePhoto,
  } = data;

  // check duplicate email
  const [exists] = await pool.query(
    "SELECT id FROM user WHERE email = ?",
    [email]
  );
  if (exists.length > 0) throw { status: 400, message: "Email already exists" };

  // insert staff user
  const [result] = await pool.query(
    `INSERT INTO user 
      (fullName, email, phone, password, roleId, branchId) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fullName, email, password, phone || null, roleId, branchId || null]
  );

  const userId = result.insertId;

  // insert staff details
  await pool.query(
    `INSERT INTO staff 
      (userId, adminId, branchId, gender, dateOfBirth, joinDate, exitDate, profilePhoto) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      adminId || null,
      branchId || null,
      gender || null,
      dateOfBirth ? new Date(dateOfBirth) : null,
      joinDate ? new Date(joinDate) : null,
      exitDate ? new Date(exitDate) : null,
      profilePhoto || null,
    ]
  );

  return { id: userId, ...data };
};

/**************************************
 * LIST STAFF
 **************************************/
export const listStaffService = async (branchId) => {
  const sql = `
    SELECT u.*, s.adminId, s.gender, s.dateOfBirth, s.joinDate, s.exitDate, s.profilePhoto
    FROM user u
    LEFT JOIN staff s ON u.id = s.userId
    WHERE u.branchId = ?
    ORDER BY u.id DESC
  `;
  const [rows] = await pool.query(sql, [branchId]);
  return rows;
};

/**************************************
 * STAFF DETAIL
 **************************************/
export const staffDetailService = async (id) => {
  const sql = `
    SELECT u.*, s.adminId, s.gender, s.dateOfBirth, s.joinDate, s.exitDate, s.profilePhoto
    FROM user u
    LEFT JOIN staff s ON u.id = s.userId
    WHERE u.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  if (rows.length === 0) throw { status: 404, message: "Staff not found" };
  return rows[0];
};

/**************************************
 * UPDATE STAFF
 **************************************/
export const updateStaffService = async (id, data) => {
  const {
    fullName,
    email,
    phone,
    password,
    roleId,
    branchId,
    adminId,
    gender,
    dateOfBirth,
    joinDate,
    exitDate,
    profilePhoto,
  } = data;

  // check duplicate email
  if (email) {
    const [exists] = await pool.query(
      "SELECT id FROM user WHERE email = ? AND id != ?",
      [email, id]
    );
    if (exists.length > 0) throw { status: 400, message: "Email already exists" };
  }

  // update user table
  await pool.query(
    `UPDATE user SET 
      fullName=?, email=?, phone=?, password=IFNULL(?, password), roleId=?, branchId=? 
     WHERE id=?`,
    [
      fullName,
      email,
      phone || null,
      password || null,
      roleId,
      branchId || null,
      id,
    ]
  );

  // update staff table
  await pool.query(
    `UPDATE staff SET 
      adminId=?, gender=?, dateOfBirth=?, joinDate=?, exitDate=?, profilePhoto=? 
     WHERE userId=?`,
    [
      adminId || null,
      gender || null,
      dateOfBirth ? new Date(dateOfBirth) : null,
      joinDate ? new Date(joinDate) : null,
      exitDate ? new Date(exitDate) : null,
      profilePhoto || null,
      id,
    ]
  );

  return staffDetailService(id);
};

/**************************************
 * DELETE STAFF
 **************************************/
export const deleteStaffService = async (id) => {
  // soft delete user and staff
  await pool.query(
    `UPDATE user SET status='Inactive' WHERE id=?`,
    [id]
  );
  await pool.query(
    `UPDATE staff SET status='Inactive', exitDate=? WHERE userId=?`,
    [new Date(), id]
  );

  return { message: "Staff deactivated successfully" };
};
