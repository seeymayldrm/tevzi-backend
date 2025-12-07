// backend/prisma/seed.js
const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
    const adminUsername = "admin";

    const existing = await prisma.user.findUnique({
        where: { username: adminUsername },
    });

    if (!existing) {
        const hashed = await bcrypt.hash("Admin123!", 10);

        await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashed,
                role: Role.ADMIN,
            },
        });

        console.log("Admin user created:");
        console.log("username: admin");
        console.log("password: Admin123!");
    } else {
        console.log("Admin user already exists, skipping.");
    }

    const dayShift = await prisma.shift.upsert({
        where: { code: "DAY" },
        update: {},
        create: {
            name: "Gündüz Vardiyası",
            code: "DAY",
            startTime: "08:00",
            endTime: "16:00",
        },
    });

    const nightShift = await prisma.shift.upsert({
        where: { code: "NIGHT" },
        update: {},
        create: {
            name: "Gece Vardiyası",
            code: "NIGHT",
            startTime: "00:00",
            endTime: "08:00",
        },
    });

    console.log("Shifts:", dayShift.code, nightShift.code);

    const station = await prisma.station.upsert({
        where: { code: "HAT1" },
        update: {},
        create: {
            name: "Hat 1",
            code: "HAT1",
            department: "Kaynak",
        },
    });

    console.log("Example station:", station.code);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        return prisma.$disconnect().finally(() => process.exit(1));
    });
