// backend/src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { CORS_ORIGIN } = require("./config/env");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
    cors({
        origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN,
    })
);
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
