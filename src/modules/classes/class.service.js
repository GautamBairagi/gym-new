import { pool } from "../../config/db.js";

/**************************************
 * CLASS TYPES
 **************************************/
export const createClassTypeService = async (name) => {
  const [[exists]] = await pool.promise().query(
    "SELECT * FROM classtype WHERE name = ?",
    [name]
  );
  if (exists) throw { status: 400, message: "Class type exists" };

  const [result] = await pool.promise().query(
    "INSERT INTO classtype (name) VALUES (?)",
    [name]
  );

  return { id: result.insertId, name };
};

export const listClassTypesService = async () => {
  const [rows] = await pool.promise().query(
    "SELECT * FROM classtype ORDER BY id DESC"
  );
  return rows;
};

/**************************************
 * CLASS SCHEDULE
 **************************************/
export const createScheduleService = async (data) => {
  const {
    branchId,
    classTypeId,
    trainerId,
    date,
    day,
    startTime,
    endTime,
    capacity,
    status = "Active",
    members = []
  } = data;

  // Required validations
  if (!branchId || !classTypeId || !trainerId || !date || !day || !startTime || !endTime || !capacity) {
    throw { status: 400, message: "All required fields must be provided." };
  }

  // Foreign key checks
  const [[trainer]] = await pool.promise().query("SELECT * FROM user WHERE id = ?", [trainerId]);
  if (!trainer) throw { status: 400, message: "Trainer does not exist." };

  const [[branch]] = await pool.promise().query("SELECT * FROM branch WHERE id = ?", [branchId]);
  if (!branch) throw { status: 400, message: "Branch does not exist." };

  const [[classType]] = await pool.promise().query("SELECT * FROM classtype WHERE id = ?", [classTypeId]);
  if (!classType) throw { status: 400, message: "Class type does not exist." };

  const [result] = await pool.promise().query(
    `INSERT INTO classschedule 
      (branchId, classTypeId, trainerId, date, day, startTime, endTime, capacity, status, members)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      branchId,
      classTypeId,
      trainerId,
      date,
      day,
      startTime,
      endTime,
      capacity,
      status,
      JSON.stringify(members),
    ]
  );

  return { id: result.insertId, ...data };
};

export const listSchedulesService = async (branchId) => {
  const [rows] = await pool.promise().query(
    `SELECT cs.*, ct.name AS classTypeName, u.fullName AS trainerName
     FROM classschedule cs
     LEFT JOIN classtype ct ON cs.classTypeId = ct.id
     LEFT JOIN user u ON cs.trainerId = u.id
     WHERE cs.branchId = ?
     ORDER BY cs.date ASC`,
    [branchId]
  );
  return rows;
};

/**************************************
 * BOOKING
 **************************************/
export const bookClassService = async (memberId, scheduleId) => {
  const [[existing]] = await pool.promise().query(
    "SELECT * FROM booking WHERE memberId = ? AND scheduleId = ?",
    [memberId, scheduleId]
  );
  if (existing) throw { status: 400, message: "Already booked for this class" };

  const [[schedule]] = await pool.promise().query(
    "SELECT * FROM classschedule WHERE id = ?",
    [scheduleId]
  );
  if (!schedule) throw { status: 404, message: "Schedule not found" };

  const [bookings] = await pool.promise().query(
    "SELECT COUNT(*) AS count FROM booking WHERE scheduleId = ?",
    [scheduleId]
  );
  if (bookings[0].count >= schedule.capacity) throw { status: 400, message: "Class is full" };

  const [result] = await pool.promise().query(
    "INSERT INTO booking (memberId, scheduleId) VALUES (?, ?)",
    [memberId, scheduleId]
  );

  return { id: result.insertId, memberId, scheduleId };
};

export const cancelBookingService = async (memberId, scheduleId) => {
  const [[existing]] = await pool.promise().query(
    "SELECT * FROM booking WHERE memberId = ? AND scheduleId = ?",
    [memberId, scheduleId]
  );
  if (!existing) throw { status: 400, message: "No booking found" };

  await pool.promise().query(
    "DELETE FROM booking WHERE id = ?",
    [existing.id]
  );

  return true;
};

export const memberBookingsService = async (memberId) => {
  const [rows] = await pool.promise().query(
    `SELECT b.*, cs.date, cs.startTime, cs.endTime, cs.day, ct.name AS className, u.fullName AS trainerName
     FROM booking b
     LEFT JOIN classschedule cs ON b.scheduleId = cs.id
     LEFT JOIN classtype ct ON cs.classTypeId = ct.id
     LEFT JOIN user u ON cs.trainerId = u.id
     WHERE b.memberId = ?
     ORDER BY b.id DESC`,
    [memberId]
  );
  return rows;
};

/**************************************
 * SCHEDULE CRUD
 **************************************/
export const getAllScheduledClassesService = async () => {
  const [rows] = await pool.promise().query(
    `SELECT cs.*, ct.name AS classTypeName, u.fullName AS trainerName, b.name AS branchName,
            (SELECT COUNT(*) FROM booking bk WHERE bk.scheduleId = cs.id) AS membersCount
     FROM classschedule cs
     LEFT JOIN classtype ct ON cs.classTypeId = ct.id
     LEFT JOIN user u ON cs.trainerId = u.id
     LEFT JOIN branch b ON cs.branchId = b.id
     ORDER BY cs.id DESC`
  );

  return rows.map((item) => ({
    id: item.id,
    className: item.classTypeName,
    trainer: item.trainerName,
    branch: item.branchName,
    date: item.date,
    time: `${item.startTime} - ${item.endTime}`,
    day: item.day,
    status: item.status,
    membersCount: item.membersCount,
  }));
};

export const getScheduleByIdService = async (id) => {
  const [[schedule]] = await pool.promise().query(
    `SELECT cs.*, ct.name AS classTypeName, u.fullName AS trainerName, b.name AS branchName
     FROM classschedule cs
     LEFT JOIN classtype ct ON cs.classTypeId = ct.id
     LEFT JOIN user u ON cs.trainerId = u.id
     LEFT JOIN branch b ON cs.branchId = b.id
     WHERE cs.id = ?`,
    [id]
  );

  if (!schedule) throw { status: 404, message: "Class schedule not found" };
  return schedule;
};

export const updateScheduleService = async (id, data) => {
  const [[exists]] = await pool.promise().query(
    "SELECT * FROM classschedule WHERE id = ?",
    [id]
  );
  if (!exists) throw { status: 404, message: "Class schedule not found" };

  const fields = [];
  const values = [];

  for (const key of [
    "branchId", "classTypeId", "trainerId", "date", "day", 
    "startTime", "endTime", "capacity", "status", "members"
  ]) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(key === "members" ? JSON.stringify(data[key]) : data[key]);
    }
  }

  if (fields.length === 0) return exists;

  values.push(id);
  await pool.promise().query(
    `UPDATE classschedule SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return { ...exists, ...data };
};

export const deleteScheduleService = async (id) => {
  const [[existing]] = await pool.promise().query(
    "SELECT * FROM classschedule WHERE id = ?",
    [id]
  );
  if (!existing) throw { status: 404, message: "Class schedule not found" };

  // Delete bookings first
  await pool.promise().query(
    "DELETE FROM booking WHERE scheduleId = ?",
    [id]
  );

  // Delete schedule
  await pool.promise().query(
    "DELETE FROM classschedule WHERE id = ?",
    [id]
  );

  return true;
};
