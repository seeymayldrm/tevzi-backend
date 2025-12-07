const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listShifts(req, res, next) {
    try {
        const shifts = await prisma.shift.findMany({
            orderBy: { startTime: "asc" },
        });
        res.json(shifts);
    } catch (err) {
        next(err);
    }
}

async function createShift(req, res, next) {
    try {
        const { name, code, startTime, endTime } = req.body;

        if (!name || !code || !startTime || !endTime) {
            return res.status(400).json({
                error: "name, code, startTime, endTime required",
            });
        }

        const shift = await prisma.shift.create({
            data: { name, code, startTime, endTime },
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
