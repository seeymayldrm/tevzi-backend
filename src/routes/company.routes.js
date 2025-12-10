// backend/src/routes/company.routes.js

const express = require("express");
const router = express.Router();

const {
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany
} = require("../controllers/company.controller");

const { authRequired, requireRole } = require("../middleware/auth");

// Tüm şirket işlemleri → Sadece SUPERADMIN
router.use(authRequired, requireRole("SUPERADMIN"));

router.get("/", listCompanies);
router.post("/", createCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

module.exports = router;
