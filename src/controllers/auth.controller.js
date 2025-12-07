const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");
const { comparePassword, hashPassword } = require("../utils/password");

const prisma = new PrismaClient();

// LOGIN
async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
                .status(400)
                .json({ error: "username and password required" });
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await comparePassword(password, user.password);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: "12h" }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (err) {
        next(err);
    }
}

// YENİ → /auth/me
async function me(req, res, next) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, username: true, role: true }
        });

        return res.json(user);
    } catch (err) {
        next(err);
    }
}

// ADMIN USER CREATE
async function createUser(req, res, next) {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res
                .status(400)
                .json({ error: "username, password, role required" });
        }

        const hashed = await hashPassword(password);

        const user = await prisma.user.create({
            data: { username, password: hashed, role },
        });

        return res.status(201).json({
            id: user.id,
            username: user.username,
            role: user.role,
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
    me, // eklendi
};
