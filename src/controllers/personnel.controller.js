const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   PERSONNEL LIST (MULTITENANT)
--------------------------------------------------- */
async function listPersonnel(req, res, next) {
    try {
        const { active } = req.query;

        const where = {
            companyId: req.user.companyId || undefined
        };

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

/* ---------------------------------------------------
   CREATE PERSONNEL (MULTITENANT)
--------------------------------------------------- */
async function createPersonnel(req, res, next) {
    try {
        const { fullName, department, title } = req.body;
        const companyId = req.user.companyId;

        if (!fullName) {
            return res.status(400).json({ error: "fullName is required" });
        }

        const person = await prisma.personnel.create({
            data: {
                fullName,
                department: department || null,
                title: title || null,
                companyId, // ⭐ şirket bağlantısı
            },
        });

        res.status(201).json(person);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   UPDATE PERSONNEL (MULTITENANT)
--------------------------------------------------- */
async function updatePersonnel(req, res, next) {
    try {
        const id = Number(req.params.id);
        const companyId = req.user.companyId;
        const { fullName, department, title, isActive } = req.body;

        // Bu personel gerçekten şirketinize mi ait?
        const existing = await prisma.personnel.findFirst({
            where: { id, companyId }
        });

        if (!existing && req.user.role !== "SUPERADMIN") {
            return res.status(403).json({
                error: "Personnel does not belong to your company."
            });
        }

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

/* ---------------------------------------------------
   DELETE PERSONNEL (SOFT DELETE) (MULTITENANT)
--------------------------------------------------- */
async function deletePersonnel(req, res, next) {
    try {
        const id = Number(req.params.id);
        const companyId = req.user.companyId;

        const person = await prisma.personnel.findFirst({
            where: { id, companyId }
        });

        if (!person && req.user.role !== "SUPERADMIN") {
            return res.status(403).json({
                error: "Personnel does not belong to your company."
            });
        }

        await prisma.personnel.update({
            where: { id },
            data: { isActive: false }
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   LIST PERSONNEL'S CARDS (MULTITENANT)
--------------------------------------------------- */
async function listCards(req, res, next) {
    try {
        const id = Number(req.params.id);
        const companyId = req.user.companyId;

        // Personel şirkete mi ait?
        const person = await prisma.personnel.findFirst({
            where: { id, companyId }
        });

        if (!person && req.user.role !== "SUPERADMIN") {
            return res.status(403).json({
                error: "Personnel does not belong to your company."
            });
        }

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
