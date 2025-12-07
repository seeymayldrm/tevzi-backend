// backend/src/server.js
const { PORT } = require("./config/env");
const app = require("./app");

app.listen(PORT, () => {
    console.log(`Tevzi API listening on port ${PORT}`);
});
