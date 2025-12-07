const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function attendanceReport(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: "date required" });

        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);

        const logs = await prisma.attendanceLog.findMany({
            where: { scannedAt: { gte: d, lt: nextDay } },
            include: { personnel: true },
            orderBy: { scannedAt: "asc" }
        });

        let csv = "Personel,UID,Tip,Saat\n";

        logs.forEach(l => {
            csv += `${l.personnel?.fullName || "-"},${l.uid},${l.type},${l.scannedAt.toLocaleTimeString()}\n`;
        });

        res.header("Content-Type", "text/csv");
        res.attachment("attendance.csv");
        res.send(csv);

    } catch (err) {
        next(err);
    }
}

module.exports = {
    attendanceReport
};
