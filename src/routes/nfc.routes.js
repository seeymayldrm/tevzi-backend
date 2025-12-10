// backend/src/routes/nfc.routes.js
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

/* ---------------------------------------------------
   NFC KART ATAMA
   ADMIN + SUPERVISOR → sadece kendi şirketine kart atar
--------------------------------------------------- */
router.post(
    "/assign-card",
    authRequired,
    requireRole("ADMIN", "SUPERVISOR"),
    assignCard
);

/* ---------------------------------------------------
   NFC OKUTMA (SCAN)
   → Bu endpoint CİHAZ tarafından çağrıldığı için taşeron giriş yapmaz.
   → Auth gerekmez.
--------------------------------------------------- */
router.post("/scan", scanCard);

/* ---------------------------------------------------
   BUGÜN LOG'LARI
   → Şirket admini sadece kendi şirketinin loglarını görebilir
--------------------------------------------------- */
router.get(
    "/today",
    authRequired,
    todayLogs
);

/* ---------------------------------------------------
   TARİHE GÖRE TÜM LOG'LAR
--------------------------------------------------- */
router.get(
    "/logs",
    authRequired,
    listLogs
);

/* ---------------------------------------------------
   ⭐ KART YÖNETİMİ
   ADMIN + SUPERVISOR → kendi şirketinin kartlarını görebilir
--------------------------------------------------- */

// 1) Tüm NFC kartlarını listele
router.get(
    "/cards",
    authRequired,
    requireRole("ADMIN", "SUPERVISOR"),
    listAllCards
);

// 2) Kart güncelle (aktif/pasif/personelId)
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
