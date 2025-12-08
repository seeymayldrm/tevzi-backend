const { PrismaClient, AttendanceType } = require("@prisma/client");
const prisma = new PrismaClient();

/* -----------------------------------------
   1) NFC KART PERSONELE BAĞLAMA
------------------------------------------ */
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

/* -----------------------------------------
   2) NFC OKUTMA – DB’ye TR zamanı yazıyoruz
------------------------------------------ */
async function scanCard(req, res, next) {
    try {
        const { uid, type, source } = req.body;

        if (!uid || !type) {
            return res.status(400).json({ error: "uid and type required" });
        }

        if (!["IN", "OUT"].includes(type)) {
            return res.status(400).json({ error: "type must be IN or OUT" });
        }

        const card = await prisma.nFCCard.findFirst({
            where: { uid, isActive: true },
            include: { personnel: true },
        });

        // Şu anki TR saatini DB'ye direkt kaydediyoruz
        const trNow = new Date();

        // Bugün başlangıcı (TR’ye göre)
        const startOfDay = new Date(trNow);
        startOfDay.setHours(0, 0, 0, 0);

        // Bugün aynı tip okutulmuş mu?
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

        // Log kaydet
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

/* -----------------------------------------
   3) BUGÜNÜN LOG'LARI
   — Artık TR hesaplamaya gerek yok
   — DB’deki saate göre direkt filtreliyoruz
------------------------------------------ */
async function todayLogs(req, res, next) {
    try {
        const now = new Date();

        const start = new Date(now);
        start.setHours(0, 0, 0, 0);

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: start } },
            include: { personnel: true },
            orderBy: { scannedAt: "desc" },
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* -----------------------------------------
   4) TARİHE GÖRE LOG'LAR (CSV için)
------------------------------------------ */
async function listLogs(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "date required" });
        }

        const start = new Date(date + "T00:00:00");
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

module.exports = {
    assignCard,
    scanCard,
    todayLogs,
    listLogs,
};
