const { PrismaClient } = require("@prisma/client");
const { normalizeDate } = require("../utils/date");

const prisma = new PrismaClient();

// TÜM ATAMALAR
async function listAssignments(req, res, next) {
    try {
        const { date, shiftId } = req.query;

        if (!date) {
            return res
                .status(400)
                .json({ error: "date (YYYY-MM-DD) required" });
        }

        const day = normalizeDate(date);

        const where = { date: day };
        if (shiftId) where.shiftId = Number(shiftId);

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

// YENİ → ASSIGNMENT GÜNCELLE (PUT)
async function updateAssignment(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { stationId, personnelId, shiftId } = req.body;

        const updated = await prisma.assignment.update({
            where: { id },
            data: {
                stationId: Number(stationId),
                personnelId: Number(personnelId),
                shiftId: Number(shiftId)
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

// YENİ → PERSONEL GEÇMİŞİ
async function personHistory(req, res, next) {
    try {
        const id = Number(req.params.id);

        const list = await prisma.assignment.findMany({
            where: { personnelId: id },
            include: { station: true, shift: true },
            orderBy: { date: "desc" }
        });

        res.json(list);
    } catch (err) {
        next(err);
    }
}

// YENİ → İSTASYON GEÇMİŞİ
async function stationHistory(req, res, next) {
    try {
        const id = Number(req.params.id);

        const list = await prisma.assignment.findMany({
            where: { stationId: id },
            include: { personnel: true, shift: true },
            orderBy: { date: "desc" }
        });

        res.json(list);
    } catch (err) {
        next(err);
    }
}

// INSERT OR UPDATE
async function upsertAssignment(req, res, next) {
    try {
        const { date, shiftId, stationId, personnelId } = req.body;

        if (!date || !shiftId || !stationId || !personnelId) {
            return res.status(400).json({
                error: "date, shiftId, stationId, personnelId required",
            });
        }

        const day = normalizeDate(date);

        const data = {
            date: day,
            shiftId: Number(shiftId),
            stationId: Number(stationId),
            personnelId: Number(personnelId),
        };

        const assignment = await prisma.assignment.upsert({
            where: {
                date_shiftId_stationId_personnelId: {
                    date: day,
                    shiftId: data.shiftId,
                    stationId: data.stationId,
                    personnelId: data.personnelId,
                },
            },
            update: {},
            create: data,
        });

        res.status(201).json(assignment);
    } catch (err) {
        next(err);
    }
}

// DELETE
async function deleteAssignment(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.assignment.delete({ where: { id } });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

// YENİ → CSV EXPORT
async function exportAssignments(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: "date required" });

        const day = normalizeDate(date);

        const list = await prisma.assignment.findMany({
            where: { date: day },
            include: { personnel: true, station: true, shift: true }
        });

        let csv = "Personel,İstasyon,Vardiya,Başlangıç,Bitiş\n";

        list.forEach(a => {
            csv += `${a.personnel.fullName},${a.station.name},${a.shift.name},${a.shift.startTime},${a.shift.endTime}\n`;
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
