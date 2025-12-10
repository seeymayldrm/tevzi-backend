// backend/src/app.js

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { CORS_ORIGIN } = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

/* -----------------------------------------------------
   CORS — Tüm Frontend Senaryoları İçin Güvenli Ayar
----------------------------------------------------- */
app.use(
    cors({
        origin: (origin, callback) => {
            // local ve deploy senaryoları için
            if (!origin) return callback(null, true);
            return callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.options("*", cors());

/* -----------------------------------------------------
   HELMET — CORS ile Çakışmayan Güvenlik Ayarları
----------------------------------------------------- */
app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

/* -----------------------------------------------------
   Body Parsers
----------------------------------------------------- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* -----------------------------------------------------
   Logger
----------------------------------------------------- */
app.use(morgan("dev"));

/* -----------------------------------------------------
   API Routes
----------------------------------------------------- */
app.use("/api", routes);

/* -----------------------------------------------------
   Error handlers
----------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
