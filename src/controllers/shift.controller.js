const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------
   1) LIST → Şirkete göre filtreli
--------------------------------------------- */
async function listShifts(req, res, next) {
    try {
        let where = {};

        // SUPERADMIN tüm şirketleri görür
        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

        const shifts = await prisma.shift.findMany({
            where,
            orderBy: { startTime: "asc" }
        });

        res.json(shifts);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------
   2) CREATE → Şirket bazlı shift ekleme
--------------------------------------------- */
async function createShift(req, res, next) {
    try {
        const { name, code, startTime, endTime } = req.body;

        if (!name || !code || !startTime || !endTime) {
            return res.status(400).json({
                error: "name, code, startTime, endTime required"
            });
        }

        // Eğer superadmin değilse → shift kendi şirketine eklenir
        const companyId =
            req.user.role === "SUPERADMIN"
                ? req.body.companyId // superadmin isterse başka şirkete eklesin
                : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                error: "companyId missing for shift creation"
            });
        }

        const shift = await prisma.shift.create({
            data: {
                name,
                code,
                startTime,
                endTime,
                companyId: Number(companyId)
            }
        });

        res.status(201).json(shift);
    } catch (err) {
        if (err.code === "P2002") {
            err.status = 400;
            err.message = "Shift code already exists";
        }
        next(err);
    }
}

module.exports = {
    listShifts,
    createShift,
};
