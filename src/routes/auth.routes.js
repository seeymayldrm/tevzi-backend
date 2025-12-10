// backend/src/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const {
    login,
    createUser,
    me
} = require("../controllers/auth.controller");

const {
    authRequired,
    requireRole
} = require("../middleware/auth");

/* ------------------------------------------------------
   LOGIN → Şirket aktif mi, kullanıcı aktif mi kontrol eder
------------------------------------------------------ */
router.post("/login", login);

/* ------------------------------------------------------
   Kullanıcıyı token'dan getir
------------------------------------------------------ */
router.get("/me", authRequired, me);

/* ------------------------------------------------------
   SUPERADMIN → Yeni kullanıcı oluşturabilir
   (Şirket admini başka şirkete user açamasın)
------------------------------------------------------ */
router.post(
    "/users",
    authRequired,
    requireRole("SUPERADMIN"),
    createUser
);

module.exports = router;
