import { pool } from "../../config/db.js";  // ✅ named import

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env.js";

/**************************************
 * REGISTER USER (CREATE)
 **************************************/
export const registerUser = async (data) => {
  const fullName = data.fullName?.trim();
  const email = data.email?.trim();
  const password = data.password;
  const phone = data.phone?.trim() || null;
  const roleId = data.roleId;
  const branchId = data.branchId || null;

  const gymName = data.gymName || null;
  const address = data.address || null;
  const planName = data.planName || null;
  const price = data.price || null;
  const duration = data.duration || null;
  const description = data.description || null;
  const status = data.status || null;

  if (!fullName || !email || !password || !roleId) {
    throw { status: 400, message: "fullName, email, password, roleId required" };
  }

  // Check email
  const [ex] = await pool.promise().query(
    "SELECT id FROM user WHERE email = ?",
    [email]
  );
  if (ex.length > 0) throw { status: 400, message: "Email already exists" };

  const hash = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO user (
      fullName, email, password, phone, roleId, branchId, 
      gymName, address, planName, price, duration, description, status
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.promise().query(sql, [
    fullName, email, hash, phone, roleId, branchId,
    gymName, address, planName, price, duration, description, status
  ]);

  // Return full user object
  return {
    id: result.insertId,
    fullName,
    email,
    phone,
    roleId,
    branchId,
    gymName,
    address,
    planName,
    price,
    duration,
    description,
    status
  };
};


/**************************************
 * LOGIN USER
 **************************************/
export const loginUser = async ({ email, password }) => {
  const sql = `
    SELECT u.*, r.name AS roleName, b.name AS branchName
    FROM user u
    LEFT JOIN role r ON r.id = u.roleId
    LEFT JOIN branch b ON b.id = u.branchId
    WHERE u.email = ?
  `;

  const [rows] = await pool.promise().query(sql, [email]);
  const user = rows[0];
  if (!user) throw { status: 400, message: "User not found" };

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw { status: 401, message: "Invalid password" };

  const token = jwt.sign(
    {
      id: user.id,
      role: user.roleName,
      branchId: user.branchId,
    },
    ENV.jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.roleName,
      branchId: user.branchId,
      branchName: user.branchName,
    }
  };
};


/**************************************
 * GET USER BY ID
 **************************************/
export const fetchUserById = async (id) => {
  const sql = `
    SELECT u.*, r.name AS roleName, b.name AS branchName
    FROM user u
    LEFT JOIN role r ON r.id = u.roleId
    LEFT JOIN branch b ON b.id = u.branchId
    WHERE u.id = ?
  `;
  const [rows] = await pool.promise().query(sql, [id]);

  if (rows.length === 0) throw { status: 404, message: "User not found" };

  return rows[0];
};


/**************************************
 * UPDATE USER
 **************************************/
export const modifyUser = async (id, data) => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const sql = `
    UPDATE user SET 
      fullName=?, email=?, phone=?, roleId=?, branchId=?, 
      gymName=?, address=?, planName=?, price=?, duration=?, 
      description=?, status=?, password=IFNULL(?, password)
    WHERE id=?
  `;

  await pool.promise().query(sql, [
    data.fullName,
    data.email,
    data.phone,
    data.roleId,
    data.branchId,
    data.gymName,
    data.address,
    data.planName,
    data.price,
    data.duration,
    data.description,
    data.status,
    data.password || null,
    id
  ]);

  return fetchUserById(id);
};


/**************************************
 * DELETE USER
 **************************************/
export const removeUser = async (id) => {
  await pool.promise().query("DELETE FROM user WHERE id = ?", [id]);
  return true;
};


/**************************************
 * GET ADMINS ONLY
 **************************************/
export const fetchAdmins = async () => {
  const sql = `
    SELECT u.*, r.name AS roleName 
    FROM user u
    LEFT JOIN role r ON r.id = u.roleId
    WHERE u.roleId = 2
  `;

  const [rows] = await pool.promise().query(sql);
  return rows;
};


/**************************************
 * DASHBOARD STATS
 **************************************/
export const fetchDashboardStats = async () => {
  const [[{ totalAdmins }]] = await pool.promise().query(
    "SELECT COUNT(*) AS totalAdmins FROM user WHERE roleId = 2"
  );

  const [[{ totalBranches }]] = await pool.promise().query(
    "SELECT COUNT(*) AS totalBranches FROM branch"
  );

  const [[{ newUsersToday }]] = await pool.promise().query(
    "SELECT COUNT(*) AS newUsersToday FROM user WHERE DATE(createdAt) = CURDATE()"
  );

  return { totalAdmins, totalBranches, newUsersToday };
};


/**************************************
 * LOGIN MEMBER (NO BCRYPT)
 **************************************/
export const loginMemberService = async ({ email, password }) => {
  const sql = `
    SELECT m.*, b.name AS branchName
    FROM member m
    LEFT JOIN branch b ON b.id = m.branchId
    WHERE m.email = ?
  `;

  const [rows] = await pool.promise().query(sql, [email]);
  const member = rows[0];

  if (!member) throw { status: 400, message: "Invalid email or password" };

  if (member.status !== "ACTIVE") {
    throw { status: 403, message: "Account disabled" };
  }

  if (member.password !== password) {
    throw { status: 400, message: "Invalid email or password" };
  }

  const token = jwt.sign(
    { id: member.id, role: "MEMBER" },
    ENV.jwtSecret,
    { expiresIn: "7d" }
  );

  return {
    token,
    member: {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      branchId: member.branchId,
      branchName: member.branchName,
    }
  };
};
