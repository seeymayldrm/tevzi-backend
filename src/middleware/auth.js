// backend/src/middleware/auth.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

/* ---------------------------------------------------
   1) TOKEN DOĞRULAMA
--------------------------------------------------- */
function authRequired(req, res, next) {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // payload → { id, role, companyId }
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/* ---------------------------------------------------
   2) ROL KISITLAMASI
--------------------------------------------------- */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

/* ---------------------------------------------------
   3) SADECE SUPERADMIN ERİŞEBİLİR
--------------------------------------------------- */
function superadminOnly(req, res, next) {
    if (!req.user || req.user.role !== "SUPERADMIN") {
        return res.status(403).json({ error: "Only SUPERADMIN allowed" });
    }
    next();
}

/* ---------------------------------------------------
   4) MULTITENANT → KAYNAK COMPANY KONTROLÜ
   usage: requireCompanyAccess(resource.companyId)
--------------------------------------------------- */
function requireCompanyAccess(getCompanyIdFn) {
    return async (req, res, next) => {
        try {
            // SUPERADMIN → TÜM ŞİRKETLERE ERİŞEBİLİR
            if (req.user.role === "SUPERADMIN") {
                return next();
            }

            const resourceCompanyId = await getCompanyIdFn(req);

            if (!resourceCompanyId) {
                return res.status(404).json({ error: "Resource not found" });
            }

            if (resourceCompanyId !== req.user.companyId) {
                return res.status(403).json({ error: "Forbidden (Company mismatch)" });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = {
    authRequired,
    requireRole,
    superadminOnly,
    requireCompanyAccess,
};
