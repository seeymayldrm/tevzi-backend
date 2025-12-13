const express = require("express");
const router = express.Router();

const {
    listDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/department.controller");

const { authRequired, requireRole } = require("../middleware/auth");

router.use(authRequired);

router.get(
    "/",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    listDepartments
);

router.post(
    "/",
    requireRole("ADMIN", "SUPERADMIN"),
    createDepartment
);

router.put(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    updateDepartment
);

router.delete(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    deleteDepartment
);

module.exports = router;
