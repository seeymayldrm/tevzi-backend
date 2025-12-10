const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function attendanceReport(req, res, next) {
    try {
        const { date } = req.query;

        if (!date) return res.status(400).json({ error: "date required" });

        // Tarih aralığı
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);

        // Multitenant filtre
        const where = {
            scannedAt: { gte: d, lt: nextDay },
        };

        // Eğer superadmin değilse → sadece kendi şirketini görür
        if (req.user.role !== "SUPERADMIN") {
            where.personnel = {
                companyId: req.user.companyId
            };
        }

        const logs = await prisma.attendanceLog.findMany({
            where,
            include: { personnel: true },
            orderBy: { scannedAt: "asc" }
        });

        // CSV Oluştur
        let csv = "Personel,UID,Tip,Saat\n";

        logs.forEach(l => {
            csv += [
                l.personnel?.fullName || "-",
                l.uid,
                l.type,
                l.scannedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
            ].join(",") + "\n";
        });

        res.header("Content-Type", "text/csv; charset=utf-8");
        res.attachment("attendance.csv");
        res.send(csv);

    } catch (err) {
        next(err);
    }
}

module.exports = {
    attendanceReport
};
