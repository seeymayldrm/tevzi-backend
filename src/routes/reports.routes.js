// backend/src/routes/reports.routes.js
const express = require("express");
const router = express.Router();

const { attendanceReport } = require("../controllers/reports.controller");
const { authRequired, requireRole } = require("../middleware/auth");

// Tüm raporlar için login gereklidir
router.use(authRequired);

/* ---------------------------------------------------
   MESAI RAPORU (ATTENDANCE REPORT)
   ADMIN, SUPERVISOR, SUPERADMIN erişebilir
--------------------------------------------------- */
router.get(
    "/attendance",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    attendanceReport
);

module.exports = router;
