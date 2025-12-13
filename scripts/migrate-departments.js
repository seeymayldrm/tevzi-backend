const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function migrateDepartments() {
    console.log("▶ Departman migration başladı");

    // 1️⃣ Tüm şirketleri al
    const companies = await prisma.company.findMany();

    for (const company of companies) {
        console.log(`\n🏢 Şirket: ${company.name}`);

        // 2️⃣ Bu şirketteki personellerin eski departmanlarını al
        const people = await prisma.personnel.findMany({
            where: {
                companyId: company.id,
                department: {
                    not: null,
                },
            },
            select: {
                department: true,
            },
        });

        // 3️⃣ Unique + temiz departman listesi
        const uniqueDepartments = [
            ...new Set(
                people
                    .map(p => p.department?.trim())
                    .filter(d => d && d.length > 0)
            ),
        ];

        console.log("📂 Bulunan departmanlar:", uniqueDepartments);

        // 4️⃣ Department tablosuna ekle (varsa geç)
        for (const name of uniqueDepartments) {
            await prisma.department.upsert({
                where: {
                    name_companyId: {
                        name,
                        companyId: company.id,
                    },
                },
                update: {},
                create: {
                    name,
                    companyId: company.id,
                },
            });
        }
    }

    console.log("\n✅ Department kayıtları oluşturuldu");
}

migrateDepartments()
    .catch(err => {
        console.error("❌ Hata:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
