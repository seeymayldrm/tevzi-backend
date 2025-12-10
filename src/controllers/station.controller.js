const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   1) STATION LIST — Şirkete göre filtre
--------------------------------------------------- */
async function listStations(req, res, next) {
    try {
        const { active } = req.query;
        const where = {};

        // MULTITENANT → Eğer superadmin değilse sadece kendi şirketi
        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

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

/* ---------------------------------------------------
   2) CREATE STATION — Şirkete bağlı oluşturma
--------------------------------------------------- */
async function createStation(req, res, next) {
    try {
        const { name, code, department } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }

        // Superadmin isterse başka şirkete ekleyebilir
        const companyId =
            req.user.role === "SUPERADMIN"
                ? req.body.companyId
                : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                error: "companyId missing for station creation",
            });
        }

        const cleanCode = code?.trim() || null;

        const station = await prisma.station.create({
            data: {
                name,
                code: cleanCode,
                department: department?.trim() || null,
                companyId: Number(companyId),
            },
        });

        res.status(201).json(station);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) UPDATE STATION — Şirket doğrulaması ile
--------------------------------------------------- */
async function updateStation(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { name, code, department, isActive } = req.body;

        // İstasyon gerçekten bu şirkete mi ait?
        const station = await prisma.station.findUnique({
            where: { id },
        });

        if (!station) {
            return res.status(404).json({ error: "Station not found" });
        }

        if (
            req.user.role !== "SUPERADMIN" &&
            station.companyId !== req.user.companyId
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const updated = await prisma.station.update({
            where: { id },
            data: {
                name,
                code: code?.trim() || null,
                department: department?.trim() || null,
                isActive,
            },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) DELETE (SOFT DELETE) — Şirket doğrulaması ile
--------------------------------------------------- */
async function deleteStation(req, res, next) {
    try {
        const id = Number(req.params.id);

        const station = await prisma.station.findUnique({
            where: { id },
        });

        if (!station) {
            return res.status(404).json({ error: "Station not found" });
        }

        if (
            req.user.role !== "SUPERADMIN" &&
            station.companyId !== req.user.companyId
        ) {
            return res.status(403).json({ error: "Forbidden" });
        }

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
