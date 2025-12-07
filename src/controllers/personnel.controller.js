const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function listPersonnel(req, res, next) {
    try {
        const { active } = req.query;

        const where = {};
        if (active === "true") where.isActive = true;
        if (active === "false") where.isActive = false;

        const people = await prisma.personnel.findMany({
            where,
            orderBy: { fullName: "asc" },
            include: { cards: true },
        });

        res.json(people);
    } catch (err) {
        next(err);
    }
}

async function createPersonnel(req, res, next) {
    try {
        const { fullName, department, title } = req.body;

        if (!fullName) {
            return res.status(400).json({ error: "fullName is required" });
        }

        const person = await prisma.personnel.create({
            data: {
                fullName,
                department: department || null,
                title: title || null,
            },
        });

        res.status(201).json(person);
    } catch (err) {
        next(err);
    }
}

async function updatePersonnel(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { fullName, department, title, isActive } = req.body;

        const person = await prisma.personnel.update({
            where: { id },
            data: {
                fullName,
                department,
                title,
                isActive,
            },
        });

        res.json(person);
    } catch (err) {
        next(err);
    }
}

// YENİ → DELETE (SOFT DELETE)
async function deletePersonnel(req, res, next) {
    try {
        const id = Number(req.params.id);

        await prisma.personnel.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

// YENİ → PERSONELİN KARTLARI
async function listCards(req, res, next) {
    try {
        const id = Number(req.params.id);

        const cards = await prisma.nFCCard.findMany({
            where: { personnelId: id },
            orderBy: { createdAt: "desc" }
        });

        res.json(cards);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    listCards
};
