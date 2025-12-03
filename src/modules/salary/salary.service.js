import { pool } from "../../config/db.js";

// ===== CREATE =====
export const createSalaryService = async (data) => {
  const {
    salaryId,
    staffId,
    role,
    periodStart,
    periodEnd,
    hoursWorked,
    hourlyRate,
    fixedSalary,
    commissionTotal,
    bonuses,
    deductions,
    status
  } = data;

  const hourlyTotal = (hoursWorked || 0) * (hourlyRate || 0);
  const bonusTotal = bonuses?.reduce((a, b) => a + Number(b.amount), 0) || 0;
  const deductionTotal = deductions?.reduce((a, b) => a + Number(b.amount), 0) || 0;

  const netPay = hourlyTotal + (fixedSalary || 0) + (commissionTotal || 0) + bonusTotal - deductionTotal;

  const [result] = await pool.query(
    `INSERT INTO Salary 
      (salaryId, staffId, role, periodStart, periodEnd, hoursWorked, hourlyRate, hourlyTotal,
       fixedSalary, commissionTotal, bonuses, deductions, netPay, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      salaryId, staffId, role, periodStart, periodEnd, hoursWorked, hourlyRate,
      hourlyTotal, fixedSalary, commissionTotal,
      JSON.stringify(bonuses || []),
      JSON.stringify(deductions || []),
      netPay,
      status
    ]
  );

  return { id: result.insertId, ...data, netPay };
};

// ===== GET ALL =====
export const getAllSalariesService = async () => {
  const [rows] = await pool.query(
    `SELECT s.*, st.fullName 
     FROM Salary s 
     LEFT JOIN Staff st ON s.staffId = st.id
     ORDER BY s.id DESC`
  );
  return rows;
};

// ===== GET BY ID =====
export const getSalaryByIdService = async (id) => {
  const [rows] = await pool.query(
    `SELECT s.*, st.fullName 
     FROM Salary s 
     LEFT JOIN Staff st ON s.staffId = st.id
     WHERE s.id = ?`,
    [id]
  );

  if (!rows.length) throw new Error("Salary not found");
  return rows[0];
};

// ===== DELETE =====
export const deleteSalaryService = async (id) => {
  await pool.query(`DELETE FROM Salary WHERE id = ?`, [id]);
  return { success: true };
};

// ===== UPDATE =====
export const updateSalaryService = async (id, data) => {
  const {
    salaryId,
    staffId,
    role,
    periodStart,
    periodEnd,
    hoursWorked,
    hourlyRate,
    fixedSalary,
    commissionTotal,
    bonuses,
    deductions,
    status
  } = data;

  const hourlyTotal = (hoursWorked || 0) * (hourlyRate || 0);
  const bonusTotal = bonuses?.reduce((a, b) => a + Number(b.amount), 0) || 0;
  const deductionTotal = deductions?.reduce((a, b) => a + Number(b.amount), 0) || 0;
  const netPay = hourlyTotal + (fixedSalary || 0) + (commissionTotal || 0) + bonusTotal - deductionTotal;

  await pool.query(
    `UPDATE Salary SET
      salaryId = ?, staffId = ?, role = ?, periodStart = ?, periodEnd = ?, hoursWorked = ?, hourlyRate = ?,
      hourlyTotal = ?, fixedSalary = ?, commissionTotal = ?, bonuses = ?, deductions = ?, netPay = ?, status = ?
     WHERE id = ?`,
    [
      salaryId, staffId, role, periodStart, periodEnd, hoursWorked, hourlyRate,
      hourlyTotal, fixedSalary, commissionTotal,
      JSON.stringify(bonuses || []),
      JSON.stringify(deductions || []),
      netPay, status, id
    ]
  );

  return { id, ...data, netPay };
};

// ===== GET BY STAFF ID =====
export const getSalaryByStaffIdService = async (staffId) => {
  const [rows] = await pool.query(
    `SELECT s.*, st.fullName 
     FROM Salary s
     LEFT JOIN Staff st ON s.staffId = st.id
     WHERE s.staffId = ?
     ORDER BY s.id DESC`,
    [staffId]
  );

  if (!rows.length) throw new Error("No salary records found for this staff");
  return rows;
};
