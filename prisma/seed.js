// backend/prisma/seed.js
const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcrypt");
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

        console.log("✔ SUPERADMIN user created:");
        console.log("   username: superadmin");
        console.log("   password: Super123!");
    } else {
        console.log("ℹ SUPERADMIN already exists, skipping.");
    }

    /* -------------------------------------------------------
       2) VT. ŞİRKET OLUŞTUR
    ------------------------------------------------------- */
    const company = await prisma.company.upsert({
        where: { name: "Vatan Denizcilik" },
        update: {},
        create: {
            name: "Vatan Denizcilik",
            logoUrl: null,
            faviconUrl: null,
            isActive: true,
        },
    });

    console.log("✔ Company:", company.name);

    console.log("🌱 Seeding completed!");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Seed error:", e);
        return prisma.$disconnect().finally(() => process.exit(1));
    });
