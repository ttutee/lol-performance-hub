const express = require("express");
const router = express.Router();

const { analyzePlayer } = require("../controllers/analysisController");

router.get("/:region/:gameName/:tagLine", analyzePlayer);

module.exports = router;