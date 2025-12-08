const { PrismaClient, AttendanceType } = require("@prisma/client");

const prisma = new PrismaClient();

/* ---------------------------------------------------
   TÜRKİYE SAATİ İLE GÜN BAŞLANGICI FONKSİYONU
--------------------------------------------------- */
function getTurkeyStartOfDay() {
    const trNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" })
    );

    trNow.setHours(0, 0, 0, 0);
    return trNow;
}

/* ---------------------------------------------------
   1) NFC KART PERSONELE BAĞLAMA
--------------------------------------------------- */
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

/* ---------------------------------------------------
   2) NFC IN / OUT OKUTMA
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

        // Aktif kartı bul
        const card = await prisma.nFCCard.findFirst({
            where: { uid, isActive: true },
            include: { personnel: true },
        });

        // Türkiye'ye göre bugünün başlangıcı
        const startOfDay = getTurkeyStartOfDay();

        // BUGÜN AYNI TIP'I OKUTMUŞ MU?
        const existing = await prisma.attendanceLog.findFirst({
            where: {
                uid,
                type: type === "IN" ? AttendanceType.IN : AttendanceType.OUT,
                scannedAt: { gte: startOfDay }
            }
        });

        if (existing) {
            return res.status(409).json({
                error: "ALREADY_SCANNED",
                message: `This card already did ${type} today.`,
                type
            });
        }

        // Log oluştur
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

/* ---------------------------------------------------
   3) BUGÜNÜN LOG'LARI (SADECE TR’YE GÖRE BUGÜN)
--------------------------------------------------- */
async function todayLogs(req, res, next) {
    try {
        const trStart = getTurkeyStartOfDay();

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: trStart } },
            include: { personnel: true },
            orderBy: { scannedAt: "desc" }
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) BELİRLİ GÜN LOG'LARI
   (CSV vs. için buraya dokunmuyoruz → eski loglar duruyor)
--------------------------------------------------- */
async function listLogs(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ error: "date (YYYY-MM-DD) required" });
        }

        // Girilen tarihin TR'ye göre başlangıcı
        const d = new Date(
            new Date(date + "T00:00:00").toLocaleString("en-US", {
                timeZone: "Europe/Istanbul",
            })
        );
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
