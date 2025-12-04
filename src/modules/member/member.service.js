import { pool } from "../../config/db.js";

/**************************************
 * CREATE MEMBER
 **************************************/
import bcrypt from "bcryptjs";

export const createMemberService = async (data) => {
  const {
    fullName,
    email,
    password,
    phone,
    planId,
    membershipFrom,
    dob,
    paymentMode,
    amountPaid,
    branchId,
    gender,
    interestedIn,
    address,
    adminId
  } = data;

  if (!fullName || !email || !password) {
    throw { status: 400, message: "fullName, email, and password are required" };
  }

  // HASH PASSWORD
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check duplicate email
  const [u1] = await pool.query("SELECT id FROM user WHERE email = ?", [email]);
  const [m1] = await pool.query("SELECT id FROM member WHERE email = ?", [email]);
  if (u1.length > 0 || m1.length > 0) throw { status: 400, message: "Email already exists" };

  // Membership dates
  const startDate = membershipFrom ? new Date(membershipFrom) : new Date();
  let endDate = null;

  if (planId) {
    const [planRows] = await pool.query("SELECT * FROM plan WHERE id = ?", [planId]);
    if (!planRows.length) throw { status: 404, message: "Invalid plan selected" };

    const plan = planRows[0];

    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(plan.duration || 0));
  }

  // ---------------------------------------------------
  // 1️⃣ INSERT INTO USER TABLE (only required fields)
  // ---------------------------------------------------
  const [userResult] = await pool.query(
    `INSERT INTO user 
      (fullName, email, password, phone, roleId, branchId, address, 
       description, duration, gymName, planName, price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, 'Active')`,
    [
      fullName,
      email,
      hashedPassword,
      phone || null,
      4,                  // roleId = 3 = MEMBER
      branchId || null,
      address || null
    ]
  );

  const userId = userResult.insertId;

  // ---------------------------------------------------
  // 2️⃣ INSERT INTO MEMBER TABLE
  // ---------------------------------------------------
  const [memberRes] = await pool.query(
    `INSERT INTO member
      (userId, fullName, email, password, phone, planId, membershipFrom, membershipTo,
       dateOfBirth, paymentMode, amountPaid, branchId, gender, interestedIn, address, 
       adminId, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
    [
      userId,
      fullName,
      email,
      hashedPassword,
      phone || null,
      planId || null,
      startDate,
      endDate,
      dob ? new Date(dob) : null,
      paymentMode || null,
      amountPaid ? Number(amountPaid) : 0,
      branchId || null,
      gender || null,
      interestedIn || null,
      address || null,
      adminId || null
    ]
  );

  return {
    message: "Member created successfully",
    userId,
    memberId: memberRes.insertId,
    fullName,
    email,
    branchId,
    membershipFrom: startDate,
    membershipTo: endDate,
    status: "Active"
  };
};



/**************************************
 * LIST MEMBERS
 **************************************/
export const listMembersService = async (branchId, page = 1, limit = 20, search = "") => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT * FROM member
    WHERE branchId = ?
  `;
  const params = [branchId];

  if (search) {
    query += " AND (fullName LIKE ? OR email LIKE ? OR phone LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " ORDER BY id DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const [items] = await pool.query(query, params);

  // Count total
  let countQuery = "SELECT COUNT(*) as total FROM member WHERE branchId = ?";
  const countParams = [branchId];
  if (search) {
    countQuery += " AND (fullName LIKE ? OR email LIKE ? OR phone LIKE ?)";
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  const [countRows] = await pool.query(countQuery, countParams);
  const total = countRows[0].total;

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

/**************************************
 * MEMBER DETAIL
 **************************************/
export const memberDetailService = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM member WHERE id = ?",
    [id]
  );

  if (rows.length === 0) throw { status: 404, message: "Member not found" };
  return rows[0];
};

/**************************************
 * UPDATE MEMBER
 **************************************/
export const updateMemberService = async (id, data) => {
  const {
    fullName,
    email,
    password,
    phone,
    planId,
    membershipFrom,
    dateOfBirth,
    paymentMode,
    amountPaid,
    branchId,
    gender,
    interestedIn,
    address,
    adminId
  } = data;

  // Duplicate check
  if (email || phone) {
    const [exists] = await pool.query(
      "SELECT id FROM member WHERE (email = ? OR phone = ?) AND id != ?",
      [email || "", phone || "", id]
    );
    if (exists.length > 0) throw { status: 400, message: "Email or phone already exists" };
  }

  // Calculate membershipTo if plan or start date changes
  let startDate = membershipFrom ? new Date(membershipFrom) : undefined;
  let endDate = undefined;

  if (planId && startDate) {
    const [planRows] = await pool.query("SELECT * FROM plan WHERE id = ?", [planId]);
    const plan = planRows[0];
    if (!plan) throw { status: 404, message: "Invalid plan selected" };
    const durationDays = Number(plan.duration) || 0;
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
  }

  // Update member
  await pool.query(
  `UPDATE member SET
    fullName = ?,
    email = ?,
    password = ?,
    phone = ?,
    planId = ?,
    membershipFrom = ?,
    membershipTo = ?,
    dateOfBirth = ?,
    paymentMode = ?,
    amountPaid = ?,
    branchId = ?,
    gender = ?,
    interestedIn = ?,
    address = ?,
    adminId = ?
  WHERE id = ?`,
  [
    fullName,
    email,
    password || null,
    phone || null,
    planId || null,
    startDate || null,
    endDate || null,
    dateOfBirth ? new Date(dateOfBirth) : null,
    paymentMode || null,
    amountPaid ? Number(amountPaid) : null,
    branchId || null,
    gender || null,
    interestedIn || null,
    address || null,  // <-- comma here
    adminId || null,  // <-- comma here
    id
  ]
);

  return memberDetailService(id);
};

/**************************************
 * DELETE (SOFT DELETE)
 **************************************/
export const deleteMemberService = async (id) => {
  await pool.query(
    "UPDATE member SET status = 'Inactive' WHERE id = ?",
    [id]
  );

  return { message: "Member deactivated successfully" };
};


// member.service.js


// ===== GET MEMBERS BY ADMIN ID =====
export const getMembersByAdminIdService = async (adminId) => {
  const [rows] = await pool.query(
    `SELECT 
        id,
        adminId,
        fullName,
        email,
        phone,
        gender,
        address,
        joinDate,
        branchId,
        planId,
        membershipFrom,
        membershipTo,
        paymentMode,
        interestedIn,
        amountPaid,
        dateOfBirth,
        status
     FROM member
     WHERE adminId = ?`,
    [adminId]
  );

  return rows;
};

     