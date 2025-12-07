const express = require("express");
const router = express.Router();
const { assignCard, scanCard, todayLogs, listLogs } = require("../controllers/nfc.controller");
const { authRequired, requireRole } = require("../middleware/auth");

// Kart tanımlama
router.post(
    "/assign-card",
    authRequired,
    requireRole("ADMIN", "SUPERVISOR"),
    assignCard
);

// NFC cihazı → IN/OUT
router.post("/scan", scanCard);

// YENİ → Bugünün hareketleri
router.get("/today", authRequired, todayLogs);

// YENİ → Belirli günün tüm logları
router.get("/logs", authRequired, listLogs);

module.exports = router;
