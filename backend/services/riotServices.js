const axios = require("axios");

const RIOT_API_KEY = process.env.RIOT_API_KEY;

const regionMap = {
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  na1: "https://na1.api.riotgames.com",
  euw1: "https://euw1.api.riotgames.com",
  americas: "https://americas.api.riotgames.com",
};

const getAccount = async (gameName, tagLine) => {
  const url = `${regionMap.americas}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  const response = await axios.get(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  return response.data;
};

const getSummoner = async (region, puuid) => {
  const url = `${regionMap[region]}/lol/summoner/v4/summoners/by-puuid/${puuid}`;

  const response = await axios.get(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  return response.data;
};

const getMatches = async (puuid) => {
  const url = `${regionMap.americas}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`;

  const response = await axios.get(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  return response.data;
};

const getMatchDetail = async (matchId) => {
  const url = `${regionMap.americas}/lol/match/v5/matches/${matchId}`;

  const response = await axios.get(url, {
    headers: { "X-Riot-Token": RIOT_API_KEY },
  });

  return response.data;
};

const getPlayerAnalysis = async (region, gameName, tagLine) => {
  try {
    const account = await getAccount(gameName, tagLine);
    const summoner = await getSummoner(region, account.puuid);
    const matchIds = await getMatches(account.puuid);

    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let wins = 0;

    const championStats = {};
    const matchHistory = [];

    const matchesToAnalyze = matchIds.slice(0, 10);

    for (const matchId of matchesToAnalyze) {
      const match = await getMatchDetail(matchId);

      const participant = match.info.participants.find(
        (p) => p.puuid === account.puuid
      );

      if (!participant) continue;

      totalKills += participant.kills;
      totalDeaths += participant.deaths;
      totalAssists += participant.assists;

      if (participant.win) wins++;

      const champ = participant.championName;
      const role = participant.teamPosition || "UNKNOWN";
      const key = `${champ}-${role}`;

      if (!championStats[key]) {
        championStats[key] = {
          champ,
          role,
          games: 0,
          wins: 0,
        };
      }

      championStats[key].games++;
      if (participant.win) championStats[key].wins++;

      matchHistory.push({
        matchId,
        champion: champ,
        role,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        gameMode: match.info.gameMode,
        date: new Date(match.info.gameCreation).toLocaleDateString("es-AR"),
      });
    }

    const games = matchHistory.length;

    const champCount = {};
    Object.values(championStats).forEach((c) => {
      if (!champCount[c.champ]) champCount[c.champ] = 0;
      champCount[c.champ] += c.games;
    });

    const mostPlayedChampion = Object.keys(champCount).reduce((a, b) =>
      champCount[a] > champCount[b] ? a : b
    );

    const sortedChampions = Object.values(championStats)
      .sort((a, b) => b.games - a.games)
      .slice(0, 3);

    const topChampions = sortedChampions.map((c) => ({
      champion: c.champ,
      role: c.role,
      games: c.games,
      winrate: `${((c.wins / c.games) * 100).toFixed(0)}%`,
    }));

    const validChampions = Object.values(championStats).filter(
      (c) => c.games >= 2
    );

    let bestCombo = null;
    let recommendation = "No hay suficientes partidas para recomendación avanzada.";

    if (validChampions.length > 0) {
      bestCombo = validChampions.reduce((a, b) => {
        const winrateA = a.wins / a.games;
        const winrateB = b.wins / b.games;
        return winrateA > winrateB ? a : b;
      });

      recommendation = `Tu mejor rendimiento es con ${bestCombo.champ} en ${bestCombo.role} (${bestCombo.games} partidas)`;
    }

    return {
      player: `${gameName}#${tagLine}`,
      region,
      level: summoner.summonerLevel,
      gamesAnalyzed: games,
      avgKDA: `${(totalKills / games).toFixed(1)}/${(totalDeaths / games).toFixed(1)}/${(totalAssists / games).toFixed(1)}`,
      winrate: `${((wins / games) * 100).toFixed(0)}%`,
      mostPlayedChampion,
      bestCombo: bestCombo
        ? {
          champion: bestCombo.champ,
          role: bestCombo.role,
          games: bestCombo.games,
          winrate: `${((bestCombo.wins / bestCombo.games) * 100).toFixed(0)}%`,
        }
        : null,
      topChampions,
      matchHistory,
      recommendation,
    };
  } catch (error) {
    console.error("Error Riot:", error.response?.data || error.message);
    throw new Error("Error al obtener datos de Riot");
  }
};

module.exports = {
  getPlayerAnalysis,
};