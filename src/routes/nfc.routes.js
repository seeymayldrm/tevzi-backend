const express = require("express");
const router = express.Router();

const {
    assignCard,
    scanCard,
    todayLogs,
    listLogs,
    listAllCards,
    updateCard,
    deleteCard
} = require("../controllers/nfc.controller");

const { authRequired, requireRole } = require("../middleware/auth");

// Kart tanımlama (personel → kart)
router.post(
    "/assign-card",
    authRequired,
    requireRole("ADMIN", "SUPERVISOR"),
    assignCard
);

// NFC cihazı → IN/OUT
router.post("/scan", scanCard);

// Bugünün hareketleri
router.get(
    "/today",
    authRequired,
    todayLogs
);

// Belirli günün tüm logları
router.get(
    "/logs",
    authRequired,
    listLogs
);

/* ---------------------------------------------------
   ⭐ YENİ: KART YÖNETİMİ ENDPOINT'LERİ
--------------------------------------------------- */

// 1) Tüm NFC kartlarını listele
router.get(
    "/cards",
    authRequired,
    requireRole("ADMIN", "SUPERVISOR"),
    listAllCards
);

// 2) Kart güncelle (aktif/pasif/personelId değiştirme)
router.put(
    "/cards/:id",
    authRequired,
    requireRole("ADMIN"),
    updateCard
);

// 3) Kart sil (tamamen kaldır)
router.delete(
    "/cards/:id",
    authRequired,
    requireRole("ADMIN"),
    deleteCard
);

module.exports = router;
