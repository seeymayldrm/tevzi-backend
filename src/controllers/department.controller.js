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

        if (!name || name.trim() === "") {
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
                isActive: true,
            },
        });

        res.status(201).json(department);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   3) UPDATE DEPARTMENT (MULTITENANT SAFE + GUARD)
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
                // 🔒 boş string gelirse ismi bozmaz
                name:
                    typeof name === "string" && name.trim() !== ""
                        ? name.trim()
                        : undefined,

                // undefined gelirse eski değer korunur
                isActive: typeof isActive === "boolean" ? isActive : undefined,
            },
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------
   4) SOFT DELETE (FK SAFE)
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

        // 🔥 FK KONTROL — PERSONNEL
        const usedByPersonnel = await prisma.personnel.findFirst({
            where: { departmentId: id },
        });

        if (usedByPersonnel) {
            return res.status(400).json({
                error: "Department is used by personnel and cannot be disabled",
            });
        }

        // 🔥 FK KONTROL — STATION
        const usedByStation = await prisma.station.findFirst({
            where: { departmentId: id },
        });

        if (usedByStation) {
            return res.status(400).json({
                error: "Department is used by stations and cannot be disabled",
            });
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
