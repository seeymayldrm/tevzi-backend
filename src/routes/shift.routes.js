// backend/src/routes/shift.routes.js
const express = require("express");
const router = express.Router();

const { listShifts, createShift } = require("../controllers/shift.controller");
const { authRequired, requireRole } = require("../middleware/auth");

// Tüm shift işlemleri login gerektirir
router.use(authRequired);

/* ---------------------------------------------------
   Vardiya Listeleme
   ADMIN, SUPERVISOR, SUPERADMIN erişebilir
--------------------------------------------------- */
router.get(
    "/",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    listShifts
);

/* ---------------------------------------------------
   Yeni Vardiya Oluşturma
   Sadece ADMIN ve SUPERADMIN erişebilir
--------------------------------------------------- */
router.post(
    "/",
    requireRole("ADMIN", "SUPERADMIN"),
    createShift
);

module.exports = router;
