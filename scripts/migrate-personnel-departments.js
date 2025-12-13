const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function linkPersonnelDepartments() {
    console.log("▶ Personnel → Department eşleştirme başladı");

    const personnelList = await prisma.personnel.findMany({
        where: {
            department: {
                not: null,
            },
        },
        include: {
            company: true,
        },
    });

    for (const person of personnelList) {
        const depName = person.department?.trim();
        if (!depName) continue;

        const department = await prisma.department.findFirst({
            where: {
                name: depName,
                companyId: person.companyId,
            },
        });

        if (!department) {
            console.warn(
                `⚠️ Bulunamadı: ${depName} (Personel: ${person.fullName})`
            );
            continue;
        }

        await prisma.personnel.update({
            where: { id: person.id },
            data: {
                departmentId: department.id,
            },
        });

        console.log(
            `✔ ${person.fullName} → ${depName}`
        );
    }

    console.log("\n✅ Personnel eşleştirme tamamlandı");
}

linkPersonnelDepartments()
    .catch(err => {
        console.error("❌ Hata:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
