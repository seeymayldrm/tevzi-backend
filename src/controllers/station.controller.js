const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   1) STATION LIST — Şirkete göre filtre (FK DEPARTMENT)
--------------------------------------------------- */
async function listStations(req, res, next) {
    try {
        const { active } = req.query;

        const where = {};

        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

        if (active === "true") where.isActive = true;
        if (active === "false") where.isActive = false;

        const stations = await prisma.station.findMany({
            where,
            orderBy: {
                name: "asc", // ✅ NULL sorununu önlemek için code yerine name
            },
            include: {
                departmentRel: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        res.json(stations);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   2) CREATE STATION — FK DEPARTMENT
--------------------------------------------------- */
async function createStation(req, res, next) {
    try {
        const { name, code, departmentId } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }

        const companyId =
            req.user.role === "SUPERADMIN"
                ? req.body.companyId
                : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                error: "companyId missing for station creation",
            });
        }

        const station = await prisma.station.create({
            data: {
                name: name.trim(),
                code: code?.trim() || null,

                // ✅ FK DEPARTMENT
                departmentId: departmentId ? Number(departmentId) : null,

                companyId: Number(companyId),
            },
        });

        res.status(201).json(station);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) UPDATE STATION — FK DEPARTMENT
--------------------------------------------------- */
async function updateStation(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { name, code, departmentId, isActive } = req.body;

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
                name: name?.trim(),
                code: code?.trim() || null,
                isActive,

                // ✅ FK UPDATE
                departmentId: departmentId ? Number(departmentId) : null,
            },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) DELETE STATION (SOFT DELETE)
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
