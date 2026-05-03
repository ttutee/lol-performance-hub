const { getPlayerAnalysis } = require("../services/riotServices");

const analyzePlayer = async (req, res) => {
  try {
    const { region, gameName, tagLine } = req.params;

    const analysis = await getPlayerAnalysis(region, gameName, tagLine);

    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: "No se pudo analizar el jugador",
      details: error.message,
    });
  }
};

module.exports = {
  analyzePlayer,
};