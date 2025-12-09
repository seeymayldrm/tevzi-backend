const { PrismaClient, AttendanceType } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   🇹🇷 TÜRKİYE SAATİ HELPER FONKSİYONLARI
--------------------------------------------------- */

// Europe/Istanbul zamanına göre "şu an"
function getTurkeyNow() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Europe/Istanbul",
        })
    );
}

// Bugünün TR’deki 00:00:00 anı
function getTurkeyStartOfDay() {
    const d = getTurkeyNow();
    d.setHours(0, 0, 0, 0);
    return d;
}

/* ---------------------------------------------------
   1) NFC KART PERSONELE BAĞLAMA
--------------------------------------------------- */
async function assignCard(req, res, next) {
    try {
        const { personnelId, uid } = req.body;

        if (!personnelId || !uid) {
            return res.status(400).json({ error: "personnelId and uid required" });
        }

        await prisma.nFCCard.updateMany({
            where: { uid },
            data: { isActive: false },
        });

        const card = await prisma.nFCCard.create({
            data: {
                uid,
                personnelId: Number(personnelId),
                isActive: true,
            },
        });

        res.status(201).json(card);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   2) NFC OKUTMA
   ▪ TR saatine göre DB'ye kaydediyoruz
   ▪ Aynı gün içinde bir kez IN, bir kez OUT yapılabilir
--------------------------------------------------- */
async function scanCard(req, res, next) {
    try {
        const { uid, type, source } = req.body;

        if (!uid || !type) {
            return res.status(400).json({ error: "uid and type required" });
        }

        if (!["IN", "OUT"].includes(type)) {
            return res.status(400).json({ error: "type must be IN or OUT" });
        }

        // Kartı bul
        const card = await prisma.nFCCard.findFirst({
            where: { uid, isActive: true },
            include: { personnel: true },
        });

        // TR: gün başlangıcı
        const startOfDay = getTurkeyStartOfDay();

        // Aynı gün aynı tip okuttu mu?
        const existing = await prisma.attendanceLog.findFirst({
            where: {
                uid,
                type: type === "IN" ? AttendanceType.IN : AttendanceType.OUT,
                scannedAt: { gte: startOfDay },
            },
        });

        if (existing) {
            return res.status(409).json({
                error: "ALREADY_SCANNED",
                message: `This card already did ${type} today.`,
                type,
            });
        }

        // TR saatine göre log kaydet
        const trNow = getTurkeyNow();

        const log = await prisma.attendanceLog.create({
            data: {
                uid,
                type: type === "IN" ? AttendanceType.IN : AttendanceType.OUT,
                source: source || null,
                scannedAt: trNow,
                cardId: card?.id ?? null,
                personnelId: card?.personnelId ?? null,
            },
        });

        res.status(201).json({
            status: "ok",
            matchedPersonnel: card?.personnel || null,
            log,
        });

    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) BUGÜNÜN LOG'LARI (TR GÜNÜNE GÖRE)
--------------------------------------------------- */
async function todayLogs(req, res, next) {
    try {
        const startOfDay = getTurkeyStartOfDay();

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: startOfDay } },
            include: { personnel: true },
            orderBy: { scannedAt: "desc" },
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) TARİHE GÖRE LOG'LAR (CSV için)
      → TR gününe göre hesaplıyoruz
--------------------------------------------------- */
async function listLogs(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "date required" });
        }

        const start = new Date(
            new Date(date + "T00:00:00").toLocaleString("en-US", {
                timeZone: "Europe/Istanbul",
            })
        );
        start.setHours(0, 0, 0, 0);

        const nextDay = new Date(start);
        nextDay.setDate(start.getDate() + 1);

        const logs = await prisma.attendanceLog.findMany({
            where: {
                scannedAt: {
                    gte: start,
                    lt: nextDay,
                },
            },
            include: { personnel: true },
            orderBy: { scannedAt: "asc" },
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   ⭐⭐ YENİ: TÜM NFC KARTLARI LİSTELE
--------------------------------------------------- */
async function listAllCards(req, res, next) {
    try {
        const cards = await prisma.nFCCard.findMany({
            include: {
                personnel: true,
                attendanceLogs: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(cards);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   ⭐⭐ YENİ: NFC KART GÜNCELLE (aktif/pasif/personel)
--------------------------------------------------- */
async function updateCard(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { isActive, personnelId } = req.body;

        const card = await prisma.nFCCard.update({
            where: { id },
            data: {
                isActive,
                personnelId: personnelId ? Number(personnelId) : null,
            }
        });

        res.json(card);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   ⭐⭐ YENİ: NFC KART SİL
--------------------------------------------------- */
async function deleteCard(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.nFCCard.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    assignCard,
    scanCard,
    todayLogs,
    listLogs,

    // YENİ EKLEDİKLER
    listAllCards,
    updateCard,
    deleteCard
};
