const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { CORS_ORIGIN } = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ---- CORS (KESİN ÇÖZÜM) ----
app.use(
    cors({
        origin: CORS_ORIGIN,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.options("*", cors());

// ---- HELMET (CORS İLE ÇAKIŞMASIN) ----
app.use(
    helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// Body parser
app.use(express.json());

// Logging
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
