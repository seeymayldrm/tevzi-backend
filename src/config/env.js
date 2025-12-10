// backend/src/config/env.js
const dotenv = require("dotenv");
dotenv.config();

/* -------------------------------------------
   ENV HELPERS
------------------------------------------- */
function optional(name, fallback = null) {
    return process.env[name] ?? fallback;
}

function required(name) {
    const val = process.env[name];

    if (!val) {
        console.warn(`⚠️ WARNING: Missing required env var: ${name}`);
        return null; // Railway deploy sırasında bloklamasın
    }
    return val;
}

/* -------------------------------------------
   EXPORT
------------------------------------------- */
module.exports = {
    PORT: process.env.PORT || 8080,

    // DATABASE
    DATABASE_URL: required("DATABASE_URL"),

    // AUTH
    JWT_SECRET: required("JWT_SECRET"),

    // CORS
    CORS_ORIGIN: optional("CORS_ORIGIN", "*"),

    /* -------------------------------------------
       MULTITENANT → SUPERADMIN SABİT HESAP
       (örn: superadmin / 123456)
    ------------------------------------------- */
    SUPERADMIN_USERNAME: required("SUPERADMIN_USERNAME"),
    SUPERADMIN_PASSWORD: required("SUPERADMIN_PASSWORD"),

    /* -------------------------------------------
       ŞİRKET LOGOLARININ HOST EDİLECEĞİ BASE URL
       ileride CDN kullanırsan buradan kontrol edilir
    ------------------------------------------- */
    COMPANY_ASSET_BASE_URL: optional(
        "COMPANY_ASSET_BASE_URL",
        "https://your-cdn-or-storage.com/"
    ),
};
