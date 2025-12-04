import { pool } from "../../config/db.js";

/**************************************
 * CREATE TASK
 **************************************/
export const createTaskService = async (data) => {
  const {
    category,
    title,
    description,
    assignedTo
  } = data;

  const [result] = await pool.query(
    `INSERT INTO housekeepingTask
      (category, title, description, assignedTo)
     VALUES (?, ?, ?, ?)`,
    [
      category,
      title,
      description || null,
      assignedTo ? Number(assignedTo) : null
    ]
  );

  // naya record wapas bhej dete hain
  const [rows] = await pool.query(
    `SELECT * FROM housekeepingTask WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
};

/**************************************
 * GET ALL TASKS
 **************************************/
export const getAllTasksService = async () => {
  // Simple list – agar staff join chahiye ho to yaha JOIN add kar sakte ho
  const [rows] = await pool.query(
    `SELECT * FROM housekeepingTask
     ORDER BY id DESC`
  );

  return rows;
};

/**************************************
 * GET TASK BY ID
 **************************************/
export const getTaskByIdService = async (id) => {
  const [rows] = await pool.query(
    `SELECT * FROM housekeepingTask
     WHERE id = ?`,
    [Number(id)]
  );

  if (rows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }

  return rows[0];
};

/**************************************
 * UPDATE TASK (partial update – Prisma jaisa)
 **************************************/
export const updateTaskService = async (id, data) => {
  const taskId = Number(id);

  // Pehle existing record nikal lo
  const [existingRows] = await pool.query(
    `SELECT * FROM housekeepingTask WHERE id = ?`,
    [taskId]
  );

  if (existingRows.length === 0) {
    throw { status: 404, message: "Task not found" };
  }

  const existing = existingRows[0];

  // Prisma me "field ?? undefined" ka matlab:
  // agar field aya hai to use karo, warna purani value rehne do
  const category = data.category ?? existing.category;
  const title = data.title ?? existing.title;
  const description = data.description ?? existing.description;
  const status = data.status ?? existing.status;
  const assignedTo =
    data.assignedTo !== undefined && data.assignedTo !== null
      ? Number(data.assignedTo)
      : existing.assignedTo;

  await pool.query(
    `UPDATE housekeepingTask SET
      category = ?,
      title = ?,
      description = ?,
      status = ?,
      assignedTo = ?
     WHERE id = ?`,
    [
      category,
      title,
      description,
      status,
      assignedTo,
      taskId
    ]
  );

  // updated record wapas bhej do
  const [rows] = await pool.query(
    `SELECT * FROM housekeepingTask WHERE id = ?`,
    [taskId]
  );

  return rows[0];
};

/**************************************
 * DELETE TASK
 **************************************/
export const deleteTaskService = async (id) => {
  await pool.query(
    `DELETE FROM housekeepingTask
     WHERE id = ?`,
    [Number(id)]
  );

  return { message: "Task deleted successfully" };
};

/**************************************
 * FILTER TASKS BY STAFF (assignedTo)
 **************************************/
export const getTasksByStaffService = async (staffId) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM housekeepingTask
     WHERE assignedTo = ?
     ORDER BY id DESC`,
    [Number(staffId)]
  );

  return rows;
};
