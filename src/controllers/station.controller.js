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

        if (!name || !code) {
            return res
                .status(400)
                .json({ error: "name and code required" });
        }

        const station = await prisma.station.create({
            data: { name, code, department },
        });

        res.status(201).json(station);
    } catch (err) {
        if (err.code === "P2002") {
            err.status = 400;
            err.message = "Station code already exists";
        }
        next(err);
    }
}

async function updateStation(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { name, code, department, isActive } = req.body;

        const station = await prisma.station.update({
            where: { id },
            data: { name, code, department, isActive },
        });

        res.json(station);
    } catch (err) {
        next(err);
    }
}

// YENİ → DELETE (soft delete)
async function deleteStation(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.station.update({
            where: { id },
            data: { isActive: false }
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
    deleteStation
};
