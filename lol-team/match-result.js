const API_KEY = 'RGAPI-d4bc7cd3-5757-4e87-af0d-8fbfd5bf7316';
const log = m => console.log(m);
const getKeyByValue = (object, value) => {
  return Object.keys(object).find(key => object[key] === value);
}
const positionOrder = {
  'top': 1,
  'jungle': 2,
  'mid': 3,
  'adc': 4,
  'support': 5,
  'all': 6,
}
let state = {};
function balanceTeamsByLevels(players) {
    // Shuffle the players array
    players = shuffle(players);
    // players.sort((a, b) => b.level - a.level);
  
    // Determine the number of players per team
    const numPlayersPerTeam = Math.floor(players.length / 2);
  
    // Initialize two empty teams
    const team1 = [];
    const team2 = [];
  
    // Initialize variables to keep track of the total skill of each team
    let totalSkill1 = 0;
    let totalSkill2 = 0;
  
    // Assign players to teams greedily, starting with the highest-skilled player
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      if (i % 2 === 0 && team1.length < numPlayersPerTeam) {
        team1.push(player);
        totalSkill1 += player.level;
      } else if (team2.length < numPlayersPerTeam) {
        team2.push(player);
        totalSkill2 += player.level;
      } else {
        team1.push(player);
        totalSkill1 += player.level;
      }
    }
  
    // If the total skill of the two teams is not equal, swap one player between teams
    const tolerance = 1; // You can adjust this tolerance value
    const MAX_TRIAL = 100000; // to prevent infinity loop
    let trial = 0;
    while (Math.abs(totalSkill1 - totalSkill2) > tolerance && trial < MAX_TRIAL) {
      let swapped = false;
      for (let i = 0; i < team1.length; i++) {
        for (let j = 0; j < team2.length; j++) {
          const newTotalSkill1 = totalSkill1 - team1[i].level + team2[j].level;
          const newTotalSkill2 = totalSkill2 - team2[j].level + team1[i].level;
          if (Math.abs(newTotalSkill1 - newTotalSkill2) < Math.abs(totalSkill1 - totalSkill2)) {
            const temp = team1[i];
            team1[i] = team2[j];
            team2[j] = temp;
            totalSkill1 = newTotalSkill1;
            totalSkill2 = newTotalSkill2;
            swapped = true;
            break;
          }
        }
        if (swapped) {
          break;
        }
      }
      trial++;
    }
  
    // Return an object with both teams
    return { team1, team2 };
  }
  
  function shuffle(array) {
    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

function totalLevels(team) {
    let sum = 0;
    team.forEach(p =>  sum += p.level);
    return sum;
}
const generatePlayer = (player) => {
    let positionsHTML = '';
    player.position.forEach(p => positionsHTML += `<div class="icon label-position-${p} me-1"></div>`);
    return `
    <div class="player mt-3 p-2 d-flex justify-content-between bg-white">
        <div class="name py-1">${player.name}</div>
        <div class="position-level d-flex">
            <div class="position d-flex me-2">
                ${positionsHTML}
            </div>
            <div class="level bg-warning p-1 d-flex justify-content-between">
              <div>${getKeyByValue(state.levelConfig, player.level)}</div>
              <div><small>(${player.level})</small></div>
            </div>
            <div class="ps-2 pe-1 opgg-link"><img class="opacity-0" src="../lib/images/opgg.png" draggable="false"></div>
        </div>
    </div>`;
};
const generateTeam = (team) => {
    let coveredPostions = new Set();
    let coveredPostionsHTML = '';
    let playersHTML = '';
    let allCounts = 0;
    let positionCounts = 0;
    team.forEach(p => {
        playersHTML += generatePlayer(p)
        p.position.forEach(position => {
          coveredPostions.add(position);
          if (position === 'all') {
            allCounts++;
          }
        });
    });
    coveredPostions = [...(coveredPostions)].sort((a, b)=>{
      return positionOrder[a] - positionOrder[b];
    });
    coveredPostions.forEach(position => {
      coveredPostionsHTML += `<div class="icon label-position-${position} me-1"></div>`
      positionCounts++;
    });
    
    // For extra All positions
    for (let i=0; i < allCounts-1 && positionCounts < 5; i++) {
      coveredPostionsHTML += `<div class="icon label-position-all me-1"></div>`;
      positionCounts++;
    }

    return `<div class="team col-5">
    ${playersHTML}
    <div class="mt-1 d-flex justify-content-between">
        <div class="covered-positions d-flex mt-2 ${positionCounts < 5 ? 'warning border border-3 border-danger' : ''}">
            ${coveredPostionsHTML}
        </div>
        <div class="total me-1 text-white">${totalLevels(team)}</div>
    </div>
    <div class="opgg-all mt-3"><a target="_blank" href="https://www.op.gg/multisearch/na?summoners="><img src="../lib/images/opgg.png"></a></div>
</div>`;
}
const vs = () => {
    return `<div class="vs col-2 text-white d-flex align-items-center justify-content-center"><img src="../lib/images/vs.png"></div>`;
}

const isValidSummonerName = async (name) => {
  const target = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${API_KEY}`;
  const res = await fetch(target);
  
  // For the case that Riot API rate limit is exausted.
  if (res.status !== 200 && res.status !== 404) {
    console.log(name, res.status)
    const opgg = `https://www.op.gg/summoners/na/${name}`;
    const resOpgg = await fetch(opgg);
    const text = await resOpgg.text();
    return text.includes('<h1 class="summoner-name"');
  }
  return res.ok;
}

const addOpggLinks = (teamIndex) => {
  const team = document.querySelectorAll('.team')[teamIndex];
  const opggForAll = team.querySelector('.opgg-all a');
  team.querySelectorAll('.player').forEach(async p => {
    const name = p.querySelector('.name').textContent;
    const opgg = p.querySelector('.opgg-link');
    if (await isValidSummonerName(name)) {
      opgg.innerHTML = `<a target="_blank" href="${`https://www.op.gg/summoners/na/${name}`}"><img src="../lib/images/opgg.png"></a>`;
      opgg.classList.remove('opacity-0');
      const { search } = new URL(opggForAll.href);
      const searchParams  = new URLSearchParams(search);
      searchParams.set('summoners', `${searchParams.get('summoners')}, ${name}`);
      opggForAll.href = `https://www.op.gg/multisearch/na?${searchParams.toString()}`;
    } else {
      opgg.innerHTML = '<img class="opacity-0" src="../lib/images/opgg.png" draggable="false">';     
    }
  });
};

const utf8ToB64 = (str) => window.btoa(unescape(encodeURIComponent(str)));
const b64ToUtf8 = (str) => decodeURIComponent(escape(window.atob(str)));
const parseEncodedTeams = (encodedTeams) => {
    try {
      return JSON.parse(b64ToUtf8(decodeURIComponent(encodedTeams)));
    } catch (e) {
      console.error(e);
    }
    return null;
}
const getUrl = (teams) => {
    const url = window.location.href.split('#')[0];
    teams.levelConfig = state.levelConfig;
    return `${url}#${utf8ToB64(JSON.stringify(teams))}`;
};

const copyState = async (teams) => {
  console.log(state);
    try {
        const blob = new Blob([getUrl(teams)], { type: 'text/plain' });
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
        alert('Share URL is copied to clipboard.');
    } catch (err) {
        console.error(err.name, err.message);
    }
    return false;
}

document.addEventListener('DOMContentLoaded', async() => {
    const { hash } = window.location;
    let decodedTeams = {};
    if (hash) {
      // window.location.hash = '';
      const encodedTeams = hash.startsWith('#') ? hash.substring(1) : hash;
      decodedTeams = parseEncodedTeams(encodedTeams);
      state.levelConfig = decodedTeams.levelConfig;
    } else {
      state = JSON.parse(window.localStorage.state);
    }

    const teams = decodedTeams.team1 ? decodedTeams : balanceTeamsByLevels(state.players);
    // console.log(teams, totalLevels(teams.team1), totalLevels(teams.team2));
    const result = document.getElementById('result_row');
    result.innerHTML = generateTeam(teams.team1) + vs() + generateTeam(teams.team2);
    addOpggLinks(0);
    addOpggLinks(1);
    document.getElementById('shareLink').addEventListener('click', () => copyState(teams));
}, false);
