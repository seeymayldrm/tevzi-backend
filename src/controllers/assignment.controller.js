const { PrismaClient } = require("@prisma/client");
const { normalizeDate } = require("../utils/date");
const prisma = new PrismaClient();

/* ----------------------------------------------------
   Helper — Şirket filtresi
---------------------------------------------------- */
function companyFilter(req) {
    if (req.user.role === "SUPERADMIN") return {};
    return { companyId: req.user.companyId };
}

/* ----------------------------------------------------
   Helper — Bir kaydın şirkete ait olup olmadığını doğrula
---------------------------------------------------- */
async function ensureBelongsToCompany(model, id, companyId, isSuperadmin) {
    if (isSuperadmin) return true;

    const item = await prisma[model].findFirst({
        where: { id, companyId }
    });

    return !!item;
}

/* ----------------------------------------------------
   1) TÜM ATAMALAR (MULTITENANT)
---------------------------------------------------- */
async function listAssignments(req, res, next) {
    try {
        const { date, shiftId, stationId } = req.query;

        if (!date) {
            return res.status(400).json({ error: "date (YYYY-MM-DD) required" });
        }

        const day = normalizeDate(date);

        const where = {
            date: day,
            ...companyFilter(req)
        };

        if (shiftId) where.shiftId = Number(shiftId);
        if (stationId) where.stationId = Number(stationId);   // 🔥 EKLENEN KISIM

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                personnel: true,
                station: true,
                shift: true,
            },
            orderBy: [{ stationId: "asc" }, { personnelId: "asc" }],
        });

        res.json(assignments);
    } catch (err) {
        next(err);
    }
}


/* ----------------------------------------------------
   2) UPDATE (MULTITENANT + GÜVENLİ)
---------------------------------------------------- */
async function updateAssignment(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { stationId, personnelId, shiftId, startTime, endTime } = req.body;

        // Kayıt user’ın şirketine mi ait?
        const existing = await prisma.assignment.findFirst({
            where: { id, ...companyFilter(req) }
        });

        if (!existing) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        const isSuperadmin = req.user.role === "SUPERADMIN";
        const companyId = req.user.companyId;

        // Yeni station, personel ve shift doğru şirkete mi ait?
        if (!(await ensureBelongsToCompany("station", Number(stationId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Station does not belong to your company" });
        }

        if (!(await ensureBelongsToCompany("personnel", Number(personnelId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Personnel does not belong to your company" });
        }

        if (!(await ensureBelongsToCompany("shift", Number(shiftId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Shift does not belong to your company" });
        }

        const updated = await prisma.assignment.update({
            where: { id },
            data: {
                stationId: Number(stationId),
                personnelId: Number(personnelId),
                shiftId: Number(shiftId),
                startTime: startTime || null,
                endTime: endTime || null
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ----------------------------------------------------
   3) PERSONEL GEÇMİŞİ
---------------------------------------------------- */
async function personHistory(req, res, next) {
    try {
        const id = Number(req.params.id);

        const list = await prisma.assignment.findMany({
            where: {
                personnelId: id,
                ...companyFilter(req)
            },
            include: { station: true, shift: true },
            orderBy: { date: "desc" }
        });

        res.json(list);
    } catch (err) {
        next(err);
    }
}

/* ----------------------------------------------------
   4) STATION GEÇMİŞİ
---------------------------------------------------- */
async function stationHistory(req, res, next) {
    try {
        const id = Number(req.params.id);

        const list = await prisma.assignment.findMany({
            where: {
                stationId: id,
                ...companyFilter(req)
            },
            include: { personnel: true, shift: true },
            orderBy: { date: "desc" }
        });

        res.json(list);
    } catch (err) {
        next(err);
    }
}

/* ----------------------------------------------------
   5) UPSERT (MULTITENANT + GÜVENLİ)
---------------------------------------------------- */
async function upsertAssignment(req, res, next) {
    try {
        const { date, shiftId, stationId, personnelId, startTime, endTime } = req.body;

        if (!date || !shiftId || !stationId || !personnelId) {
            return res.status(400).json({
                error: "date, shiftId, stationId, personnelId required",
            });
        }

        const day = normalizeDate(date);
        const isSuperadmin = req.user.role === "SUPERADMIN";

        let companyId = req.user.companyId;
        if (isSuperadmin) {
            companyId = req.body.companyId;
            if (!companyId) {
                return res.status(400).json({ error: "companyId required for SUPERADMIN" });
            }
        }

        // ID'ler doğru şirkete ait mi?
        if (!(await ensureBelongsToCompany("station", Number(stationId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Station does not belong to your company" });
        }

        if (!(await ensureBelongsToCompany("personnel", Number(personnelId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Personnel does not belong to your company" });
        }

        if (!(await ensureBelongsToCompany("shift", Number(shiftId), companyId, isSuperadmin))) {
            return res.status(403).json({ error: "Shift does not belong to your company" });
        }

        const data = {
            date: day,
            shiftId: Number(shiftId),
            stationId: Number(stationId),
            personnelId: Number(personnelId),
            startTime: startTime || null,
            endTime: endTime || null,
            companyId: Number(companyId),
        };

        const assignment = await prisma.assignment.upsert({
            where: {
                date_shiftId_stationId_personnelId: {
                    date: day,
                    shiftId: data.shiftId,
                    stationId: data.stationId,
                    personnelId: data.personnelId
                },
            },
            update: {
                startTime: data.startTime,
                endTime: data.endTime
            },
            create: data,
        });

        res.status(201).json(assignment);
    } catch (err) {
        next(err);
    }
}

/* ----------------------------------------------------
   6) DELETE (MULTITENANT)
---------------------------------------------------- */
async function deleteAssignment(req, res, next) {
    try {
        const id = Number(req.params.id);

        const existing = await prisma.assignment.findFirst({
            where: { id, ...companyFilter(req) }
        });

        if (!existing) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        await prisma.assignment.delete({ where: { id } });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/* ----------------------------------------------------
   7) CSV EXPORT (MULTITENANT)
---------------------------------------------------- */
async function exportAssignments(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: "date required" });

        const day = normalizeDate(date);

        const list = await prisma.assignment.findMany({
            where: {
                date: day,
                ...companyFilter(req)
            },
            include: { personnel: true, station: true, shift: true }
        });

        let csv = "Personel,İstasyon,Vardiya,Başlangıç,Bitiş\n";

        list.forEach(a => {
            csv += `${a.personnel.fullName},${a.station.name},${a.shift.name},${a.startTime || "-"},${a.endTime || "-"}\n`;
        });

        res.header("Content-Type", "text/csv");
        res.attachment("tevzi.csv");
        res.send(csv);

    } catch (err) {
        next(err);
    }
}

module.exports = {
    listAssignments,
    upsertAssignment,
    deleteAssignment,
    updateAssignment,
    personHistory,
    stationHistory,
    exportAssignments
};
