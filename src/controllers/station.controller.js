const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listStations(req, res, next) {
    try {
        const { active } = req.query;
        const where = {};

        if (active === "true") where.isActive = true;
        if (active === "false") where.isActive = false;

        const stations = await prisma.station.findMany({
            where,
            orderBy: { code: "asc" },
        });

        res.json(stations);
    } catch (err) {
        next(err);
    }
}

async function createStation(req, res, next) {
    try {
        const { name, code, department } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }

        // boş string veya boşluklu değer → NULL
        const cleanCode = code?.trim() || null;

        const station = await prisma.station.create({
            data: {
                name,
                code: cleanCode,
                department: department?.trim() || null,
            },
        });

        res.status(201).json(station);
    } catch (err) {
        next(err);
    }
}

async function updateStation(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { name, code, department, isActive } = req.body;

        const cleanCode = code?.trim() || null;

        const station = await prisma.station.update({
            where: { id },
            data: {
                name,
                code: cleanCode,
                department: department?.trim() || null,
                isActive,
            },
        });

        res.json(station);
    } catch (err) {
        next(err);
    }
}

async function deleteStation(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.station.update({
            where: { id },
            data: { isActive: false },
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listStations,
    createStation,
    updateStation,
    deleteStation,
};
