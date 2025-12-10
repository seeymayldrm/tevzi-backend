// backend/src/controllers/company.controller.js

const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../utils/password");

const prisma = new PrismaClient();

/* -----------------------------------------------------
   1) TÜM ŞİRKETLERİ LİSTELE (Sadece SUPERADMIN)
----------------------------------------------------- */
async function listCompanies(req, res, next) {
    try {
        const companies = await prisma.company.findMany({
            orderBy: { id: "asc" },
            include: {
                users: {
                    select: { id: true, username: true, role: true }
                }
            }
        });

        res.json(companies);
    } catch (err) {
        next(err);
    }
}

/* -----------------------------------------------------
   2) YENİ ŞİRKET OLUŞTUR + İSTEĞE BAĞLI ADMIN EKLE
----------------------------------------------------- */
async function createCompany(req, res, next) {
    try {
        const { name, logoUrl, faviconUrl, adminUsername, adminPassword } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Company name is required" });
        }

        const company = await prisma.company.create({
            data: {
                name,
                logoUrl: logoUrl || null,
                faviconUrl: faviconUrl || null,
            }
        });

        // Eğer admin bilgisi verildiyse otomatik oluştur
        if (adminUsername && adminPassword) {
            const hashed = await hashPassword(adminPassword);

            await prisma.user.create({
                data: {
                    username: adminUsername,
                    password: hashed,
                    role: "ADMIN",
                    companyId: company.id
                }
            });
        }

        res.status(201).json(company);
    } catch (err) {
        next(err);
    }
}

/* -----------------------------------------------------
   3) ŞİRKET GÜNCELLE
----------------------------------------------------- */
async function updateCompany(req, res, next) {
    try {
        const id = Number(req.params.id);

        const { name, logoUrl, faviconUrl, isActive } = req.body;

        const updated = await prisma.company.update({
            where: { id },
            data: {
                name,
                logoUrl,
                faviconUrl,
                isActive
            }
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* -----------------------------------------------------
   4) ŞİRKET SİLME (Soft Delete)
----------------------------------------------------- */
async function deleteCompany(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.company.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listCompanies,
    createCompany,
    updateCompany,
    deleteCompany
};
