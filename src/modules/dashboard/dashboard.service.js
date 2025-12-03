import { pool } from "../../config/db.js";
import { startOfMonth } from "date-fns";

export const dashboardService = async () => {
  const today = new Date();
  const monthStart = startOfMonth(today);

  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const conn = pool.promise();

  // --- Total Revenue ---
  const [[totalRevenueRow]] = await conn.query(
    "SELECT SUM(amount) AS totalRevenue FROM payment"
  );
  const totalRevenue = Number(totalRevenueRow.totalRevenue || 0);

  // --- New Members This Month ---
  const [[newMembersRow]] = await conn.query(
    "SELECT COUNT(*) AS count FROM member WHERE joinDate >= ?",
    [monthStartStr]
  );
  const newMembers = Number(newMembersRow.count);

  // --- Active Members ---
  const [[activeMembersRow]] = await conn.query(
    "SELECT COUNT(*) AS count FROM member WHERE membershipTo >= ?",
    [todayStr]
  );
  const activeMembers = Number(activeMembersRow.count);

  // --- Check-ins This Month ---
  const [[checkInsRow]] = await conn.query(
    "SELECT COUNT(*) AS count FROM memberAttendance WHERE checkIn >= ?",
    [monthStartStr]
  );
  const checkIns = Number(checkInsRow.count);

  // --- PT Revenue ---
  const [[ptRevenueRow]] = await conn.query(
    `SELECT COALESCE(SUM(p.amount),0) AS revenue
     FROM payment p
     JOIN plan pl ON p.planId = pl.id
     WHERE pl.category = 'PT'`
  );
  const ptRevenue = Number(ptRevenueRow.revenue);

  // --- Overdue Members ---
  const [[arOverdueRow]] = await conn.query(
    "SELECT COUNT(*) AS count FROM member WHERE membershipTo < ?",
    [todayStr]
  );
  const arOverdue = Number(arOverdueRow.count);

  // --- Revenue Graph ---
  const [revenueGraphRows] = await conn.query(
    `SELECT DATE(paymentDate) AS day, SUM(amount) AS revenue
     FROM payment
     WHERE paymentDate >= ?
     GROUP BY DATE(paymentDate)
     ORDER BY DATE(paymentDate)`,
    [monthStartStr]
  );
  const revenueGraph = revenueGraphRows.map(r => ({
    day: r.day,
    revenue: Number(r.revenue),
  }));

  // --- Branch Leaderboard ---
  const [branchLeaderboardRows] = await conn.query(
    `SELECT 
       b.name AS branch,
       COALESCE(SUM(p.amount), 0) AS revenue,
       COUNT(m.id) AS new
     FROM branch b
     LEFT JOIN member m 
       ON m.branchId = b.id AND m.joinDate >= ?
     LEFT JOIN payment p 
       ON p.memberId = m.id
     GROUP BY b.id
     ORDER BY revenue DESC`,
    [monthStartStr]
  );
  const branchLeaderboard = branchLeaderboardRows.map(b => ({
    branch: b.branch,
    revenue: Number(b.revenue),
    new: Number(b.new),
  }));

  return {
    totalRevenue,
    newMembers,
    activeMembers,
    checkIns,
    ptRevenue,
    arOverdue,
    revenueGraph,
    branchLeaderboard,
    dashboardAlerts: [],
  };
};
