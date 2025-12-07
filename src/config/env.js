// backend/src/config/env.js
const dotenv = require("dotenv");

dotenv.config();

function required(name) {
    const val = process.env[name];
    if (!val) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return val;
}

const PORT = process.env.PORT || 3000;
const DATABASE_URL = required("DATABASE_URL");
const JWT_SECRET = required("JWT_SECRET");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

module.exports = {
    PORT,
    DATABASE_URL,
    JWT_SECRET,
    CORS_ORIGIN,
};
