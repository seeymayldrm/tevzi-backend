const express = require("express");
const router = express.Router();
const { login, createUser, me } = require("../controllers/auth.controller");
const { authRequired, requireRole } = require("../middleware/auth");

// LOGIN
router.post("/login", login);

// TOKEN'DAN KULLANICI AL
router.get("/me", authRequired, me);

// ADMIN → Yeni kullanıcı ekleme
router.post(
    "/users",
    authRequired,
    requireRole("ADMIN"),
    createUser
);

module.exports = router;
