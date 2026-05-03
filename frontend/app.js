let performanceChart = null;

const championImage = (champ) =>
  `https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/${champ}.png`;

async function analyze() {
  const name = document.getElementById("name").value.trim();
  const tag = document.getElementById("tag").value.trim();
  const region = document.getElementById("region").value;
  const resultDiv = document.getElementById("result");

  if (!name || !tag) {
    resultDiv.innerHTML = "Ingresá nombre y tag";
    return;
  }

  resultDiv.innerHTML = "Analizando...";

  try {
    const response = await fetch(
      `http://localhost:3000/api/analysis/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`
    );

    const data = await response.json();

    if (data.error) {
      resultDiv.innerHTML = "Error: " + data.error;
      return;
    }

    const bestChampion = data.bestCombo
      ? data.bestCombo.champion
      : data.mostPlayedChampion;

    const topChampsHTML = data.topChampions
      .map(
        (c) => `
        <div class="champ-card">
          <img 
            src="${championImage(c.champion)}" 
            onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/Ahri.png'"
          />
          <div>
            <strong>${c.champion}</strong><br/>
            ${c.role} • ${c.games} partidas • ${c.winrate}
          </div>
        </div>
      `
      )
      .join("");

    const matchHistoryHTML = data.matchHistory
      .map(
        (m) => `
        <div class="match-card ${m.win ? "win" : "lose"}">
          <img 
            src="${championImage(m.champion)}" 
            onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/Ahri.png'"
          />

          <div class="match-info">
            <strong>${m.win ? "Victoria" : "Derrota"} - ${m.champion}</strong>
            <span>${m.role} • ${m.gameMode} • ${m.date}</span>
          </div>

          <div class="match-kda">
            ${m.kills}/${m.deaths}/${m.assists}
          </div>
        </div>
      `
      )
      .join("");

    resultDiv.innerHTML = `
      <h2>${data.player}</h2>

      <div class="champion-box">
        <img 
          src="${championImage(bestChampion)}"
          onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.8.1/img/champion/Ahri.png'"
        />
        <h3>${bestChampion}</h3>
      </div>

      <div class="stat"><span>Nivel</span><span>${data.level}</span></div>
      <div class="stat"><span>Partidas analizadas</span><span>${data.gamesAnalyzed}</span></div>
      <div class="stat"><span>KDA promedio</span><span>${data.avgKDA}</span></div>
      <div class="stat"><span>Winrate</span><span>${data.winrate}</span></div>
      <div class="stat"><span>Main Champ</span><span>${data.mostPlayedChampion}</span></div>

      <div class="highlight">${data.recommendation}</div>

      <h3 class="section-title">
        Top Campeones - últimas ${data.gamesAnalyzed} partidas
      </h3>

      ${topChampsHTML}

      <div class="chart-box">
        <canvas id="performanceChart"></canvas>
      </div>

      <h3 class="section-title">Últimas partidas</h3>

      ${matchHistoryHTML}
    `;

    createChart(data);
  } catch (error) {
    resultDiv.innerHTML = "Error conectando con el servidor";
  }
}

function createChart(data) {
  const ctx = document.getElementById("performanceChart");

  const winrateNumber = Number(data.winrate.replace("%", ""));
  const losses = 100 - winrateNumber;

  if (performanceChart) {
    performanceChart.destroy();
  }

  performanceChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Victorias", "Derrotas"],
      datasets: [
        {
          data: [winrateNumber, losses],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: "white",
          },
        },
      },
    },
  });
}