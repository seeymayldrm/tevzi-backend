const express = require("express");
const router = express.Router();
const {
    listAssignments,
    upsertAssignment,
    deleteAssignment,
    updateAssignment,
    personHistory,
    stationHistory,
    exportAssignments
} = require("../controllers/assignment.controller");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

router.get("/", listAssignments);
router.post("/", upsertAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

router.get("/person/:id", personHistory);
router.get("/station/:id", stationHistory);

// CSV EXPORT
router.get("/export/csv", exportAssignments);

module.exports = router;
