// backend/src/config/env.js
const dotenv = require("dotenv");
dotenv.config();

function optional(name, fallback = null) {
    return process.env[name] || fallback;
}

function required(name) {
    const val = process.env[name];
    if (!val) {
        console.warn(`⚠️ Warning: Missing required env var: ${name}`);
        return null; // Railway deploy sırasında hata fırlatmasın
    }
    return val;
}

module.exports = {
    PORT: process.env.PORT || 8080,        // Railway tarafından atanır
    DATABASE_URL: required("DATABASE_URL"),
    JWT_SECRET: required("JWT_SECRET"),
    CORS_ORIGIN: optional("CORS_ORIGIN", "*"),
};
