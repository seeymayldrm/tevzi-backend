const express = require("express");
const router = express.Router();
const {
    listStations,
    createStation,
    updateStation,
    deleteStation
} = require("../controllers/station.controller");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

router.get("/", listStations);
router.post("/", createStation);
router.put("/:id", updateStation);
router.delete("/:id", deleteStation);

module.exports = router;
