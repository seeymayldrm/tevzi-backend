// backend/src/routes/index.js

const express = require("express");
const router = express.Router();

// ROUTES
const authRoutes = require("./auth.routes");
const personnelRoutes = require("./personnel.routes");
const stationRoutes = require("./station.routes");
const shiftRoutes = require("./shift.routes");
const assignmentRoutes = require("./assignment.routes");
const nfcRoutes = require("./nfc.routes");
const reportsRoutes = require("./reports.routes");
const companyRoutes = require("./company.routes");
const departmentRoutes = require("./department.routes");

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

/* -----------------------------------------------------
   ROUTE REGISTRATION
----------------------------------------------------- */
router.use("/auth", authRoutes);

// ⭐ SUPERADMIN → Company Yönetimi
router.use("/company", companyRoutes); // ← ← DÜZELTİLDİ

// Şirket bazlı endpointler
router.use("/personnel", personnelRoutes);
router.use("/stations", stationRoutes);
router.use("/shifts", shiftRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/nfc", nfcRoutes);
router.use("/reports", reportsRoutes);
router.use("/departments", departmentRoutes);

module.exports = router;
