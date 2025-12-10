// backend/src/routes/personnel.routes.js
const express = require("express");
const router = express.Router();

const {
    listPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    listCards
} = require("../controllers/personnel.controller");

const { authRequired, requireRole } = require("../middleware/auth");

// Tüm Personnel işlemleri → login gerekli
router.use(authRequired);

/* ---------------------------------------------------
   PERSONEL LİSTELEME
   ADMIN + SUPERVISOR → kendi şirketinin personelini görür
--------------------------------------------------- */
router.get(
    "/",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    listPersonnel
);

/* ---------------------------------------------------
   PERSONEL OLUŞTURMA
   Sadece ADMIN + SUPERADMIN
--------------------------------------------------- */
router.post(
    "/",
    requireRole("ADMIN", "SUPERADMIN"),
    createPersonnel
);

/* ---------------------------------------------------
   PERSONEL GÜNCELLEME
   Sadece ADMIN + SUPERADMIN
--------------------------------------------------- */
router.put(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    updatePersonnel
);

/* ---------------------------------------------------
   PERSONEL SİLME (soft delete)
   Sadece ADMIN + SUPERADMIN
--------------------------------------------------- */
router.delete(
    "/:id",
    requireRole("ADMIN", "SUPERADMIN"),
    deletePersonnel
);

/* ---------------------------------------------------
   PERSONELİN KARTLARI
   ADMIN + SUPERVISOR + SUPERADMIN görebilir
--------------------------------------------------- */
router.get(
    "/:id/cards",
    requireRole("ADMIN", "SUPERVISOR", "SUPERADMIN"),
    listCards
);

module.exports = router;
