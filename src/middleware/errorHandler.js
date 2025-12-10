// backend/src/middleware/errorHandler.js

function notFound(req, res, next) {
    res.status(404).json({ error: "Not found" });
}

function errorHandler(err, req, res, next) {
    console.error("🔥 ERROR:", err);

    let status = err.status || 500;
    let message = err.message || "Internal server error";

    /* ----------------------------------------------------
       PRISMA HATALARI
    ---------------------------------------------------- */
    if (err.code === "P2002") {
        // Unique constraint violation
        status = 400;
        message = "A record with this value already exists.";
    }

    if (err.code === "P2025") {
        // Record not found
        status = 404;
        message = "Record not found";
    }

    /* ----------------------------------------------------
       JWT HATALARI
    ---------------------------------------------------- */
    if (err.name === "JsonWebTokenError") {
        status = 401;
        message = "Invalid token";
    }

    if (err.name === "TokenExpiredError") {
        status = 401;
        message = "Token expired";
    }

    /* ----------------------------------------------------
       MULTITENANT OK → COMPANY EŞLEŞMEMESİ
    ---------------------------------------------------- */
    if (err.code === "COMPANY_FORBIDDEN") {
        status = 403;
        message = "Access denied: You cannot access another company's data.";
    }

    /* ----------------------------------------------------
       VALIDATION
    ---------------------------------------------------- */
    if (err.code === "VALIDATION_ERROR") {
        status = 400;
        message = err.details || "Validation error";
    }

    /* ----------------------------------------------------
       SONUÇ DÖN
    ---------------------------------------------------- */
    res.status(status).json({
        error: message,
        status,
    });
}

module.exports = { notFound, errorHandler };
