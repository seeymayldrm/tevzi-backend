const { PrismaClient, AttendanceType } = require("@prisma/client");

const prisma = new PrismaClient();

// NFC kart personele bağlama
async function assignCard(req, res, next) {
    try {
        const { personnelId, uid } = req.body;

        if (!personnelId || !uid) {
            return res
                .status(400)
                .json({ error: "personnelId and uid required" });
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

// IN/OUT log
async function scanCard(req, res, next) {
    try {
        const { uid, type, source } = req.body;

        if (!uid || !type) {
            return res
                .status(400)
                .json({ error: "uid and type required" });
        }

        if (!["IN", "OUT"].includes(type)) {
            return res
                .status(400)
                .json({ error: "type must be IN or OUT" });
        }

        const card = await prisma.nFCCard.findFirst({
            where: { uid, isActive: true },
            include: { personnel: true },
        });

        const log = await prisma.attendanceLog.create({
            data: {
                uid,
                type: type === "IN" ? AttendanceType.IN : AttendanceType.OUT,
                source: source || null,
                cardId: card?.id ?? null,
                personnelId: card?.personnelId ?? null,
            },
        });

        return res.status(201).json({
            status: "ok",
            matchedPersonnel: card?.personnel
                ? {
                    id: card.personnel.id,
                    fullName: card.personnel.fullName,
                    department: card.personnel.department,
                }
                : null,
            log,
        });
    } catch (err) {
        next(err);
    }
}

// YENİ → Bugünün logları
async function todayLogs(req, res, next) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: today } },
            include: { personnel: true },
            orderBy: { scannedAt: "desc" }
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

// YENİ → Belirli günün tüm logları
async function listLogs(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "date (YYYY-MM-DD) required" });
        }

        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: d, lt: nextDay } },
            include: { personnel: true },
            orderBy: { scannedAt: "asc" }
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
    listLogs
};
