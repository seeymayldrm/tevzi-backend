const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { comparePassword, hashPassword } = require("../utils/password");

const prisma = new PrismaClient();

/* ---------------------------------------------------------
   LOGIN (SUPERADMIN + COMPANY CHECK)
--------------------------------------------------------- */
async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "username and password required" });
        }

        const user = await prisma.user.findUnique({
            where: { username },
            include: { company: true }
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Şifre kontrolü
        const ok = await comparePassword(password, user.password);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // SUPERADMIN değilse şirket aktif olmalı
        if (user.role !== "SUPERADMIN") {
            if (!user.company || !user.company.isActive) {
                return res.status(403).json({
                    error: "Company is inactive. Access denied."
                });
            }
        }

        // JWT token
        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                username: user.username,
                companyId: user.companyId ?? null
            },
            JWT_SECRET,
            { expiresIn: "12h" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                companyId: user.companyId ?? null
            }
        });

    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------
   TOKEN BİLGİLERİNDEN USER GETİR
--------------------------------------------------------- */
async function me(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                role: true,
                companyId: true
            }
        });

        return res.json(user);
    } catch (err) {
        next(err);
    }
}

/* ---------------------------------------------------------
   USER CREATE (MULTITENANT SAFE)
--------------------------------------------------------- */
async function createUser(req, res, next) {
    try {
        const { username, password, role, companyId } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({
                error: "username, password, role required"
            });
        }

        let targetCompanyId = companyId;

        /* -------------------------------
           ADMIN → sadece kendi şirketine user ekler
           ve sadece SUPERVISOR oluşturabilir.
        -------------------------------- */
        if (req.user.role === "ADMIN") {
            targetCompanyId = req.user.companyId;

            if (role !== "SUPERVISOR") {
                return res.status(403).json({
                    error: "ADMIN can only create SUPERVISOR users."
                });
            }
        }

        /* -------------------------------
           SUPERADMIN → companyId zorunlu
        -------------------------------- */
        if (req.user.role === "SUPERADMIN") {
            if (!targetCompanyId) {
                return res.status(400).json({
                    error: "companyId is required for new users"
                });
            }

            // Şirket var mı kontrol
            const exists = await prisma.company.findUnique({
                where: { id: Number(targetCompanyId) }
            });

            if (!exists) {
                return res.status(404).json({
                    error: "Company not found"
                });
            }
        }

        /* -------------------------------
           Şifre hash
        -------------------------------- */
        const hashed = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashed,
                role,
                companyId: Number(targetCompanyId)
            }
        });

        return res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
            companyId: user.companyId
        });

    } catch (err) {
        if (err.code === "P2002") {
            err.status = 400;
            err.message = "Username already exists";
        }
        next(err);
    }
}

module.exports = {
    login,
    createUser,
    me,
};
