const express = require("express");
const router = express.Router();
const { attendanceReport } = require("../controllers/reports.controller");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

router.get("/attendance", attendanceReport);

module.exports = router;
