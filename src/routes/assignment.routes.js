// backend/src/routes/assignment.routes.js
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

// 🔐 Tüm assignment işlemleri login gerektirir
router.use(authRequired);

/* ------------------------------------------------------
   LIST / CREATE / UPDATE / DELETE
------------------------------------------------------ */
router.get("/", listAssignments);
router.post("/", upsertAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

/* ------------------------------------------------------
   HISTORY ENDPOINTS
------------------------------------------------------ */
router.get("/person/:id", personHistory);
router.get("/station/:id", stationHistory);

/* ------------------------------------------------------
   EXPORT CSV
------------------------------------------------------ */
router.get("/export/csv", exportAssignments);

module.exports = router;
