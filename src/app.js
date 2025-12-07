// backend/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { CORS_ORIGIN } = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ---- CORS FIX ----
app.use(
    cors({
        origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
        optionsSuccessStatus: 200,
    })
);

// Preflight OPTIONS
app.options("*", cors());

// Security
app.use(helmet());

// JSON parsing
app.use(express.json());

// Request logs
app.use(morgan("dev"));

// API routes
app.use("/api", routes);

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
