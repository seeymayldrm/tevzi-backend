const { PrismaClient, AttendanceType } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   🇹🇷 TÜRKİYE SAATİ HELPER FONKSİYONLARI
--------------------------------------------------- */

function getTurkeyNow() {
    return new Date(
        new Date().toLocaleString("en-US", {
            timeZone: "Europe/Istanbul",
        })
    );
}

function getTurkeyStartOfDay() {
    const d = getTurkeyNow();
    d.setHours(0, 0, 0, 0);
    return d;
}

/* ---------------------------------------------------
   HELPER → SUPERADMIN mi?
--------------------------------------------------- */
function isSuperadmin(req) {
    return req.user?.role === "SUPERADMIN";
}

/* ---------------------------------------------------
   1) KART ATAMA (MULTITENANT SAFE)
--------------------------------------------------- */
async function assignCard(req, res, next) {
    try {
        let { personnelId, uid, companyId } = req.body;

        // ADMIN ve SUPERVISOR kendi şirketine atama yapabilir
        if (!isSuperadmin(req)) {
            companyId = req.user.companyId;
        }

        if (!personnelId || !uid || !companyId) {
            return res.status(400).json({
                error: "personnelId, uid and companyId are required"
            });
        }

        // Personel doğru şirkete mi ait?
        const person = await prisma.personnel.findFirst({
            where: { id: Number(personnelId), companyId: Number(companyId) }
        });

        if (!person) {
            return res.status(403).json({
                error: "Personnel does not belong to this company."
            });
        }

        // Aynı UID varsa o şirkette pasif yap
        await prisma.nFCCard.updateMany({
            where: { uid, companyId: Number(companyId) },
            data: { isActive: false }
        });

        const card = await prisma.nFCCard.create({
            data: {
                uid,
                companyId: Number(companyId),
                personnelId: Number(personnelId),
                isActive: true
            }
        });

        res.status(201).json(card);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   2) NFC OKUTMA (SCAN) — CİHAZ TARAFI
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

        // Kartı bul (şirket bilgisi içeriyor)
        const card = await prisma.nFCCard.findFirst({
            where: { uid, isActive: true },
            include: { personnel: true }
        });

        if (!card) {
            return res.status(404).json({
                error: "CARD_NOT_FOUND",
                message: "No active card with this UID"
            });
        }

        const companyId = card.companyId;
        const startOfDay = getTurkeyStartOfDay();

        // Bu kart bugün aynı işlemi yaptı mı?
        const existing = await prisma.attendanceLog.findFirst({
            where: {
                uid,
                companyId,
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

        const trNow = getTurkeyNow();

        const log = await prisma.attendanceLog.create({
            data: {
                uid,
                type: type === "IN" ? AttendanceType.IN : AttendanceType.OUT,
                source: source || null,
                scannedAt: trNow,
                personnelId: card.personnelId,
                cardId: card.id,
                companyId
            }
        });

        res.json({
            status: "ok",
            matchedPersonnel: card.personnel,
            log
        });

    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) BUGÜNÜN LOG'LARI (Multitenant)
--------------------------------------------------- */
async function todayLogs(req, res, next) {
    try {
        const companyId = req.user.companyId;
        const startOfDay = getTurkeyStartOfDay();

        const logs = await prisma.attendanceLog.findMany({
            where: { companyId, scannedAt: { gte: startOfDay } },
            include: { personnel: true },
            orderBy: { scannedAt: "desc" }
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) Belirli Günün Logları
--------------------------------------------------- */
async function listLogs(req, res, next) {
    try {
        const { date } = req.query;
        const companyId = req.user.companyId;

        if (!date) return res.status(400).json({ error: "date required" });

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
                companyId,
                scannedAt: { gte: start, lt: nextDay }
            },
            include: { personnel: true },
            orderBy: { scannedAt: "asc" }
        });

        res.json(logs);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   5) Kart Listeleme
--------------------------------------------------- */
async function listAllCards(req, res, next) {
    try {
        const companyId = req.user.companyId;

        const cards = await prisma.nFCCard.findMany({
            where: { companyId },
            include: { personnel: true, attendanceLogs: true },
            orderBy: { createdAt: "desc" }
        });

        res.json(cards);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   6) Kart Güncelleme
--------------------------------------------------- */
async function updateCard(req, res, next) {
    try {
        const id = Number(req.params.id);
        const requesterCompanyId = req.user.companyId;
        const superadmin = isSuperadmin(req);

        const existing = await prisma.nFCCard.findUnique({ where: { id } });

        if (!existing) return res.status(404).json({ error: "Card not found" });

        if (!superadmin && existing.companyId !== requesterCompanyId) {
            return res.status(403).json({ error: "Forbidden (company mismatch)" });
        }

        const { isActive, personnelId } = req.body;

        if (personnelId) {
            const belongs = await prisma.personnel.findFirst({
                where: {
                    id: Number(personnelId),
                    companyId: existing.companyId
                }
            });

            if (!belongs) {
                return res.status(403).json({
                    error: "Personnel does not belong to this company."
                });
            }
        }

        const updated = await prisma.nFCCard.update({
            where: { id },
            data: {
                isActive,
                personnelId: personnelId ? Number(personnelId) : null
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   7) Kart Silme
--------------------------------------------------- */
async function deleteCard(req, res, next) {
    try {
        const id = Number(req.params.id);
        const requesterCompanyId = req.user.companyId;
        const superadmin = isSuperadmin(req);

        const existing = await prisma.nFCCard.findUnique({ where: { id } });

        if (!existing) {
            return res.status(404).json({ error: "Card not found" });
        }

        if (!superadmin && existing.companyId !== requesterCompanyId) {
            return res.status(403).json({
                error: "Forbidden (company mismatch)"
            });
        }

        await prisma.nFCCard.delete({ where: { id } });

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
    listAllCards,
    updateCard,
    deleteCard
};
