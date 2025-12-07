const app = require("./app");
const { PORT } = require("./config/env");

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Tevzi API running on port ${PORT}`);
});
