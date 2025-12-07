const express = require("express");
const router = express.Router();
const {
    listShifts,
    createShift,
} = require("../controllers/shift.controller");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

router.get("/", listShifts);
router.post("/", createShift);

module.exports = router;
