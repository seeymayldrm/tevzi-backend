// backend/src/server.js

const app = require("./app");
const { PORT } = require("./config/env");

// Railway / Render / Docker uyumlu host
const HOST = "0.0.0.0";

function startServer() {
    try {
        app.listen(PORT, HOST, () => {
            console.log("===========================================");
            console.log("🚀 Tevzi NFC Multitenant API Running");
            console.log(`🔌 Port: ${PORT}`);
            console.log(`🌍 Host: ${HOST}`);
            console.log("===========================================");
        });
    } catch (err) {
        console.error("❌ Server failed to start:", err);
        process.exit(1);
    }
}

startServer();

/* -----------------------------------------------
   Graceful Shutdown — Production Best Practice
----------------------------------------------- */
process.on("SIGTERM", () => {
    console.log("⛔ SIGTERM received. Shutting down gracefully...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("⛔ SIGINT received. Shutting down gracefully...");
    process.exit(0);
});
