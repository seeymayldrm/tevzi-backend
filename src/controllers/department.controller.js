const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* ---------------------------------------------------
   1) DEPARTMENT LIST — Şirkete göre filtre
--------------------------------------------------- */
async function listDepartments(req, res, next) {
    try {
        const { active } = req.query;

        const where = {};

        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

        if (active === "true") where.isActive = true;
        if (active === "false") where.isActive = false;

        const departments = await prisma.department.findMany({
            where,
            orderBy: { name: "asc" },
        });

        res.json(departments);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   2) CREATE DEPARTMENT
--------------------------------------------------- */
async function createDepartment(req, res, next) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "name is required" });
        }

        const companyId =
            req.user.role === "SUPERADMIN"
                ? req.body.companyId
                : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({
                error: "companyId missing for department creation",
            });
        }

        const department = await prisma.department.create({
            data: {
                name: name.trim(),
                companyId: Number(companyId),
                isActive: true
            },
        });

        res.status(201).json(department);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) UPDATE DEPARTMENT (MULTITENANT SAFE)
--------------------------------------------------- */
async function updateDepartment(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { name, isActive } = req.body;

        const where = { id };

        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

        const department = await prisma.department.findFirst({ where });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        const updated = await prisma.department.update({
            where: { id },
            data: {
                name: name?.trim(),
                isActive,
            },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) SOFT DELETE (MULTITENANT SAFE)
--------------------------------------------------- */
async function deleteDepartment(req, res, next) {
    try {
        const id = Number(req.params.id);

        const where = { id };

        if (req.user.role !== "SUPERADMIN") {
            where.companyId = req.user.companyId;
        }

        const department = await prisma.department.findFirst({ where });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        await prisma.department.update({
            where: { id },
            data: { isActive: false },
        });

        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
};
