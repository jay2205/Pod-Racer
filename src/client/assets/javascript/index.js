// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined,
};

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then((tracks) => {
      const html = renderTrackCards(tracks);
      renderAt("#tracks", html);
    });

    getRacers().then((racers) => {
      const html = renderRacerCars(racers);
      renderAt("#racers", html);
    });
  } catch (error) {
    console.log("Problem getting tracks and racers ::", error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    "click",
    function (event) {
      const { target } = event;
      // const { parentElement } = target;
      // console.log(parentElement);

      // Race track form field
      if (target.matches(".card.track")) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches(".card.podracer")) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches("#submit-create-race")) {
        event.preventDefault();
        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches("#gas-peddle")) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  } catch (error) {
    console.log("an error shouldn't be possible here");
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  const { track_id, player_id, track } = store;
  try {
    if (!track_id) throw new Error("Track is not seleted");
    if (!player_id) throw new Error("Racer is not selected");
    // render starting UI
    renderAt("#race", renderRaceStartView(track));
    const race = await createRace(player_id, track_id);
    store.race_id = race.ID - 1;
    await runCountdown();
    await startRace(race.ID - 1);
    await runRace(race.ID - 1);	
  } catch (err) {
    // console.log(err.message);
	alert(err.message);
  }
}

async function runRace(raceID) {
  try {
    return new Promise((resolve) => {
	const inProgressMessage = ['Vroom.', 'Vro0m..', 'Vroom...', 'Vroom....'];
      const raceInterval = setInterval(async () => {
        const raceDetials = await getRace(raceID);
		const randomInt = Math.floor(Math.random() * 3);
        if (raceDetials?.status === "in-progress") {
          renderAt("#leaderBoard", raceProgress(raceDetials.positions, 'In progress '+ inProgressMessage[randomInt]));
        } else if (raceDetials?.status === "finished") {
          clearInterval(raceInterval);
          renderAt("#race", resultsView(raceDetials.positions, 'Finished'));
          resolve(raceDetials);
        }
      }, 500);
    });
  } catch (err) {
    // console.error(err);
	alert(err.message);
  }
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;
    return new Promise((resolve) => {
      const counter = setInterval(() => {
        document.getElementById("big-numbers").innerHTML = --timer;
        if (timer === 0) {
          clearInterval(counter);
          resolve();
        }
      }, 1000);
    });
  } catch (err) {
    // console.error(error);
	alert(err.message);
  }
}

function handleSelectPodRacer(target) {

  // remove class selected from all racer options
  const selected = document.querySelector("#racers .selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  // add class selected to current target
  target.classList.add("selected");
  store.player_id = target.id;
}

function handleSelectTrack(target) {
  // remove class selected from all track options
  const selected = document.querySelector("#tracks .selected");
  if (selected) {
    selected.classList.remove("selected");
  }
  // add class selected to current target
  target.classList.add("selected");
  // TODO - save the selected track id to the store
  store.track_id = target.id;
  store.track = { name: target.innerText };
}

async function handleAccelerate() {
  await accelerate(store.race_id);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join("");

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `<h4>Loading Tracks...</4>`;
  }

  const results = tracks.map(renderTrackCard).join("");

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions, status) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions, status)}
			<a class= "button" href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions, status) {
  const { player_id } = store;
  const userPlayer = positions.find((e) => e.id === parseInt(player_id));
  userPlayer.driver_name += " (you)";
  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));
  let count = 1;

  const results = positions.map((p) => {
    return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
  }).join(' ');

  return `
		<main>
			<h3>Leaderboard</h3>
			<h4>Race status: ${status}
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);
  node.innerHTML = html;
}

// ^ Provided code ^ do not remove

// API CALLS ------------------------------------------------

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
  return {
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": SERVER,
    },
  };
}

async function getTracks() {
  // GET request to `${SERVER}/api/tracks`
  try {
    const res = await fetch(`${SERVER}/api/tracks`);
    return await res.json();
  } catch (err) {
    console.log("Problem while getting tracks: ", err);
  }
}

async function getRacers() {
  // GET request to `${SERVER}/api/cars`
  try {
    const res = await fetch(`${SERVER}/api/cars`);
    return await res.json();
  } catch (err) {
    console.log("Problem while getting racers: ", err);
  }
}

async function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  try {
    const res = await fetch(`${SERVER}/api/races`, {
      method: "POST",
      ...defaultFetchOpts(),
      dataType: "jsonp",
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    return console.log("Problem with createRace request::", err);
  }
}

async function getRace(id) {
  // GET request to `${SERVER}/api/races/${id}`
  try {
    const res = await fetch(`${SERVER}/api/races/${id}`);
    return await res.json();
  } catch (err) {
    console.log("Problem while getting race details: ", err);
  }
}

async function startRace(id) {
  try {
    const res = await fetch(`${SERVER}/api/races/${id}/start`, {
      method: "POST",
      ...defaultFetchOpts(),
    });
    return await res.json();
  } catch (err) {
    return console.log("Problem with startRace request::", err);
  }
}

async function accelerate(id) {
  try {
    const res = await fetch(`${SERVER}/api/races/${id}/accelerate`, {
      method: "POST",
      ...defaultFetchOpts(),
    });
    return await res.json();
  } catch (err) {
    return console.log("Problem with accelerate request::", err);
  }
}
