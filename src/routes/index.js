const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const personnelRoutes = require("./personnel.routes");
const stationRoutes = require("./station.routes");
const shiftRoutes = require("./shift.routes");
const assignmentRoutes = require("./assignment.routes");
const nfcRoutes = require("./nfc.routes");
const reportsRoutes = require("./reports.routes");

router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/personnel", personnelRoutes);
router.use("/stations", stationRoutes);
router.use("/shifts", shiftRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/nfc", nfcRoutes);
router.use("/reports", reportsRoutes);

module.exports = router;
