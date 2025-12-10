// backend/prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding started...");

    /* -------------------------------------------------------
       1) SUPERADMIN OLUŞTUR
    ------------------------------------------------------- */
    const superAdminUsername = "superadmin";

    const existingSuper = await prisma.user.findUnique({
        where: { username: superAdminUsername },
    });

    if (!existingSuper) {
        const hashed = await bcrypt.hash("Super123!", 10);

        await prisma.user.create({
            data: {
                username: superAdminUsername,
                password: hashed,
                role: "SUPERADMIN",
                companyId: null,
            },
        });

        console.log("✔ SUPERADMIN created (username: superadmin / password: Super123!)");
    } else {
        console.log("ℹ SUPERADMIN already exists, skipping.");
    }

    /* -------------------------------------------------------
       2) VATAN DENİZCİLİK ŞİRKETİ YOKSA OLUŞTUR
    ------------------------------------------------------- */
    let company = await prisma.company.findFirst({
        where: { name: "Vatan Denizcilik" }
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: "Vatan Denizcilik",
                logoUrl: null,
                faviconUrl: null,
                isActive: true,
            },
        });

        console.log("✔ Company created:", company.name);
    } else {
        console.log("ℹ Company already exists:", company.name);
    }

    /* -------------------------------------------------------
       3) ADMIN YOKSA OLUŞTUR
    ------------------------------------------------------- */
    const adminUsername = "admin";

    const existingAdmin = await prisma.user.findUnique({
        where: { username: adminUsername },
    });

    if (!existingAdmin) {
        const hashed = await bcrypt.hash("Admin123!", 10);

        await prisma.user.create({
            data: {
                username: adminUsername,
                password: hashed,
                role: "ADMIN",
                companyId: company.id,
            },
        });

        console.log("✔ ADMIN created (username: admin / password: Admin123!)");
    } else {
        console.log("ℹ ADMIN already exists, skipping.");
    }

    console.log("🌱 Seeding completed!");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Seed error:", e);
        return prisma.$disconnect().finally(() => process.exit(1));
    });
