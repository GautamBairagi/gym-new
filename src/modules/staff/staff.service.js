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
    [fullName, email, phone || null,password,  roleId, branchId || null]
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
    SELECT 
      u.id, u.fullName, u.email, u.phone, u.roleId, u.branchId,
      s.adminId, s.gender, s.dateOfBirth, s.joinDate, s.exitDate, s.profilePhoto
    FROM user u
    LEFT JOIN staff s ON u.id = s.userId
    WHERE u.roleId = 4 AND u.branchId = ?
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
    SELECT 
      u.id, u.fullName, u.email, u.phone, u.roleId, u.branchId,
      s.adminId, s.gender, s.dateOfBirth, s.joinDate, s.exitDate, s.profilePhoto
    FROM user u
    LEFT JOIN staff s ON u.id = s.userId
    WHERE s.id = ?
  `;
  const [rows] = await pool.query(sql, [id]);
  if (rows.length === 0) throw { status: 404, message: "Staff not found" };
  return rows[0];
};


/**************************************
 * UPDATE STAFF
 **************************************/
export const updateStaffService = async (staffId, data) => {
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

  // 1️⃣ Fetch userId from staff table using staffId
  const [staffRows] = await pool.query(
    "SELECT userId FROM staff WHERE id = ?",
    [staffId]
  );

  if (staffRows.length === 0) {
    throw { status: 404, message: "Staff not found" };
  }

  const userId = staffRows[0].userId;

  // 2️⃣ Check duplicate email (if any)
  if (email) {
    const [exists] = await pool.query(
      "SELECT id FROM user WHERE email = ? AND id != ?",
      [email, userId]
    );
    if (exists.length > 0) {
      throw { status: 400, message: "Email already exists" };
    }
  }

  // 3️⃣ Update USER table
  await pool.query(
    `UPDATE user SET
      fullName = ?,
      email = ?,
      phone = ?,
      password = IFNULL(?, password),
      roleId = ?,
      branchId = ?
     WHERE id = ?`,
    [
      fullName,
      email,
      phone || null,
      password || null,
      roleId,
      branchId || null,
      userId,
    ]
  );

  // 4️⃣ Update STAFF table
  await pool.query(
    `UPDATE staff SET
      adminId = ?,
      gender = ?,
      dateOfBirth = ?,
      joinDate = ?,
      exitDate = ?,
      profilePhoto = ?
     WHERE id = ?`,
    [
      adminId || null,
      gender || null,
      dateOfBirth ? new Date(dateOfBirth) : null,
      joinDate ? new Date(joinDate) : null,
      exitDate ? new Date(exitDate) : null,
      profilePhoto || null,
      staffId     // <-- Correct value
    ]
  );

  // 5️⃣ Return updated staff detail
  return staffDetailService(staffId);
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
