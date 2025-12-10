// backend/src/routes/station.routes.js

const express = require("express");
const router = express.Router();

const {
    listStations,
    createStation,
    updateStation,
    deleteStation
} = require("../controllers/station.controller");

const { authRequired, requireRole } = require("../middleware/auth");

// Tüm station işlemleri login gerektirir
router.use(authRequired);

/* ---------------------------------------------------
   1) İstasyon Listeleme
   ADMIN, SUPERVISOR, SUPERADMIN → erişebilir
--------------------------------------------------- */
router.get(
    "/",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    listStations
);

/* ---------------------------------------------------
   2) Yeni İstasyon Ekleme
   Sadece ADMIN & SUPERADMIN erişebilir
--------------------------------------------------- */
router.post(
    "/",
    requireRole("ADMIN", "SUPERADMIN"),
    createStation
);

/* ---------------------------------------------------
   3) İstasyon Güncelleme
   Sadece ADMIN & SUPERADMIN erişebilir
--------------------------------------------------- */
router.put(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    updateStation
);

/* ---------------------------------------------------
   4) Soft Delete (Pasif Yapma)
   Sadece ADMIN & SUPERADMIN erişebilir
--------------------------------------------------- */
router.delete(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    deleteStation
);

module.exports = router;
