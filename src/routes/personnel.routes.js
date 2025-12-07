const express = require("express");
const router = express.Router();
const {
    listPersonnel,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    listCards
} = require("../controllers/personnel.controller");
const { authRequired } = require("../middleware/auth");

router.use(authRequired);

router.get("/", listPersonnel);
router.post("/", createPersonnel);
router.put("/:id", updatePersonnel);
router.delete("/:id", deletePersonnel);

router.get("/:id/cards", listCards);

module.exports = router;
