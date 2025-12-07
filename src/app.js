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
const corsOptions = {
    origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    optionsSuccessStatus: 200,
};

// Sadece **bir kere** cors() çağırıyoruz:
app.use(cors(corsOptions));

// Preflight manuel handle
app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});

// Security middleware
app.use(helmet());

// JSON body parser
app.use(express.json());

// Logging
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
