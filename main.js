/* ═══════════════════════════════════════════════════════════════
   Weathermap — Main Application
   ═══════════════════════════════════════════════════════════════ */

const APIKey = "d9e2f08a5cbb73d08a34ce3d5739a56b";

/* ──── DOM refs ──── */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const sections = {
  home:    $("#section-home"),
  forecast:$("#section-forecast"),
  map:     $("#section-map"),
  about:   $("#section-about"),
};

/* ──── Navigation (SPA) ──── */
$$(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const page = link.dataset.nav;
    showPage(page);
    // close mobile nav
    $("#mobileNav").classList.remove("open");
  });
});

$("#hamburger").addEventListener("click", () => {
  $("#mobileNav").classList.toggle("open");
});

function showPage(page) {
  Object.keys(sections).forEach((k) => {
    sections[k].classList.toggle("active", k === page);
  });
  $$(".nav-link").forEach((l) => {
    l.classList.toggle("active", l.dataset.nav === page);
  });
  // If switching to map, invalidate size (Leaflet needs it)
  if (page === "map" && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 100);
  }
}

/* ═══════════════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════════════ */
const themeBtn = $("#themeBtn");
const themeIcon = themeBtn.querySelector("i");

function getTheme()  { return localStorage.getItem("wm-theme") || "dark"; }
function setTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("wm-theme", t);
  themeIcon.className = t === "dark" ? "fas fa-moon" : "fas fa-sun";
}
setTheme(getTheme());

themeBtn.addEventListener("click", () => {
  setTheme(getTheme() === "dark" ? "light" : "dark");
});

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
function timeFromTs(ts, tzOffset) {
  const d = new Date((ts + tzOffset) * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function hourFromTs(ts, tzOffset) {
  const d = new Date((ts + tzOffset) * 1000);
  return d.getUTCHours();
}

function dayName(ts, tzOffset) {
  const d = new Date((ts + tzOffset) * 1000);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const targetUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((targetUTC - todayUTC) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return days[d.getUTCDay()];
}

function uvDescription(uvi) {
  if (uvi <= 2)   return "Low";
  if (uvi <= 5)   return "Moderate";
  if (uvi <= 7)   return "High";
  if (uvi <= 10)  return "Very High";
  return "Extreme";
}

function aqiDescription(aqi) {
  return ["—","Good","Fair","Moderate","Poor","Very Poor"][aqi] || "—";
}

function getIconPath(weatherMain) {
  const map = {
    Clouds:  "svg/clouds.png",
    Clear:   "svg/clear.png",
    Drizzle: "svg/drizzle.png",
    Rain:    "svg/rain.png",
    Snow:    "svg/snow.png",
    Mist:    "svg/mist.png",
    Haze:    "svg/mist.png",
    Fog:     "svg/mist.png",
    Thunderstorm: "svg/rain.png",
  };
  return map[weatherMain] || "svg/clouds.png";
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════════ */
function showSkeleton() {
  $("#homeSkeleton").style.display = "flex";
  $("#homeContent").style.display = "none";
}
function hideSkeleton() {
  $("#homeSkeleton").style.display = "none";
  $("#homeContent").style.display = "flex";
}

/* ═══════════════════════════════════════════════════════════════
   MAIN WEATHER + FORECAST + AIR QUALITY FETCH
   ═══════════════════════════════════════════════════════════════ */
async function fetchWeather(city) {
  showSkeleton();
  try {
    const [wRes, fRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${APIKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${APIKey}`),
    ]);
    if (!wRes.ok) throw new Error("City not found");
    const w = await wRes.json();
    const f = await fRes.json();
    await fetchAirQuality(w.coord.lat, w.coord.lon);
    renderCurrent(w);
    renderForecast(f, w.timezone);
  } catch (err) {
    alert("Could not find that city. Please try again.");
    $("#homeSkeleton").style.display = "none";
    $("#homeContent").style.display = "none";
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showSkeleton();
  try {
    const [wRes, fRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${APIKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${APIKey}`),
    ]);
    if (!wRes.ok) throw new Error("No data");
    const w = await wRes.json();
    const f = await fRes.json();
    await fetchAirQuality(lat, lon);
    renderCurrent(w);
    renderForecast(f, w.timezone);
  } catch (err) {
    alert("Could not get weather for this location.");
    $("#homeSkeleton").style.display = "none";
    $("#homeContent").style.display = "none";
  }
}

async function fetchAirQuality(lat, lon) {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${APIKey}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.list && data.list[0]) {
        const aqi = data.list[0].main.aqi;
        $("#airQuality").textContent = aqiDescription(aqi);
      }
    }
  } catch (_) { /* ignore */ }
}

/* ═══════════════════════════════════════════════════════════════
   RENDER CURRENT WEATHER
   ═══════════════════════════════════════════════════════════════ */
function renderCurrent(w) {
  const tzOffset = w.timezone; // seconds
  const sunriseTs = w.sys.sunrise;
  const sunsetTs  = w.sys.sunset;

  $("#location").textContent = w.name + ", " + (w.sys.country || "");
  $("#weatherCondetion").textContent = w.weather[0].description;
  $("#weatherImage").src = getIconPath(w.weather[0].main);
  $("#temp").textContent = Math.round(w.main.temp) + "°";
  $("#highTemp").textContent = "H: " + Math.round(w.main.temp_max) + "°";
  $("#lowTemp").textContent  = "L: " + Math.round(w.main.temp_min) + "°";

  // Local time from timezone offset
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + tzOffset * 1000);
  $("#localTime").textContent = local.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  $("#sunrise").textContent = timeFromTs(sunriseTs, tzOffset);
  $("#sunset").textContent  = timeFromTs(sunsetTs, tzOffset);
  $("#humidity").textContent = w.main.humidity + "%";
  $("#feelsLike").textContent = Math.round(w.main.feels_like) + "°";
  $("#pressure").textContent = w.main.pressure + " hPa";
  $("#visibility").textContent = (w.visibility / 1000).toFixed(1) + " km";
  $("#windSpeed").textContent = w.wind.speed + " m/s";

  // UV Index — approximate based on sun position (free API doesn't always include it)
  const uvi = approximateUV(w.coord.lat, local);
  $("#uvIndex").textContent = uvi.toFixed(1) + " (" + uvDescription(uvi) + ")";

  hideSkeleton();

  // Re-trigger animations
  document.querySelectorAll(".fade-in, .fade-in-delayed").forEach(el => {
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "";
  });
}

/* Approximate UV based on latitude & hour (solar elevation angle) */
function approximateUV(lat, date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const hour = date.getHours() + date.getMinutes() / 60;
  // Simplified solar declination
  const decl = 23.45 * Math.sin((360 / 365) * (284 + (month - 1) * 30 + day) * Math.PI / 180);
  const hourAngle = (hour - 12) * 15;
  const latRad = lat * Math.PI / 180;
  const declRad = decl * Math.PI / 180;
  const haRad = hourAngle * Math.PI / 180;
  const sinElev = Math.sin(latRad) * Math.sin(declRad) +
                  Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad);
  const elev = Math.asin(Math.max(-1, Math.min(1, sinElev))) * 180 / Math.PI;
  if (elev < 0) return 0;
  // Rough UV: scales from 0 at horizon to ~11 at zenith (simplified)
  let uvi = Math.max(0, (elev / 90) * 11 * (lat > 0 ? 0.8 : 1.1));
  // Adjust for latitude (higher latitudes get less UV)
  uvi *= Math.max(0.3, Math.min(1.2, 1 - Math.abs(lat) / 90 * 0.5));
  return Math.round(Math.min(11, uvi) * 10) / 10;
}

/* ═══════════════════════════════════════════════════════════════
   RENDER FORECAST
   ═══════════════════════════════════════════════════════════════ */
function renderForecast(f, tzOffset) {
  const hourlyEl = $("#hourlyContainer");
  const dailyEl  = $("#dailyContainer");
  hourlyEl.innerHTML = "";
  dailyEl.innerHTML  = "";

  const list = f.list;

  // ── Hourly (next 24 entries ~ 24h) ──
  for (let i = 0; i < Math.min(24, list.length); i++) {
    const item = list[i];
    const hr = hourFromTs(item.dt, tzOffset);
    const hourLabel = hr === 0 ? "12 AM" : hr < 12 ? hr + " AM" : hr === 12 ? "12 PM" : (hr - 12) + " PM";
    const div = document.createElement("div");
    div.className = "hourly-item";
    div.innerHTML = `
      <span class="hourly-time">${hourLabel}</span>
      <img class="hourly-icon" src="${getIconPath(item.weather[0].main)}" alt="">
      <span class="hourly-temp">${Math.round(item.main.temp)}°</span>
    `;
    hourlyEl.appendChild(div);
  }

  // ── Daily (aggregate from 3‑hour chunks) ──
  const dayMap = {};
  for (const item of list) {
    const key = dayName(item.dt, tzOffset);
    if (!dayMap[key]) {
      dayMap[key] = { highs: [], lows: [], icons: [], descs: [] };
    }
    dayMap[key].highs.push(item.main.temp_max);
    dayMap[key].lows.push(item.main.temp_min);
    dayMap[key].icons.push(item.weather[0].main);
    dayMap[key].descs.push(item.weather[0].description);
  }

  let idx = 0;
  for (const [day, d] of Object.entries(dayMap)) {
    if (idx >= 7) break;
    idx++;
    const high = Math.round(Math.max(...d.highs));
    const low  = Math.round(Math.min(...d.lows));
    // Most common icon
    const iconMode = d.icons.sort((a,b) =>
      d.icons.filter(v=>v===a).length - d.icons.filter(v=>v===b).length
    ).pop();
    const desc = d.descs[Math.floor(d.descs.length / 2)];

    const div = document.createElement("div");
    div.className = "daily-item";
    div.innerHTML = `
      <span class="daily-day">${day}</span>
      <img class="daily-icon" src="${getIconPath(iconMode)}" alt="">
      <span class="daily-desc">${desc}</span>
      <span class="daily-temps">
        <span class="daily-high">${high}°</span>
        <span class="daily-low">${low}°</span>
      </span>
    `;
    dailyEl.appendChild(div);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH
   ═══════════════════════════════════════════════════════════════ */
$("#searchBtn").addEventListener("click", () => {
  const q = $("#searchInput").value.trim();
  if (q) {
    fetchWeather(q);
    showPage("home");
    $("#searchInput").value = "";
  }
});

$("#searchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    $("#searchBtn").click();
  }
});

/* ═══════════════════════════════════════════════════════════════
   GEOLOCATION
   ═══════════════════════════════════════════════════════════════ */
$("#geoBtn").addEventListener("click", () => {
  if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      showPage("home");
    },
    () => { alert("Could not get your location. Please search a city manually."); }
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAP — Leaflet
   ═══════════════════════════════════════════════════════════════ */
let mapInstance = null;
let mapMarker = null;
let selectedLat = null;
let selectedLon = null;

function initMap() {
  if (mapInstance) return;
  mapInstance = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(mapInstance);

  mapInstance.on("click", (e) => {
    selectedLat = e.latlng.lat;
    selectedLon = e.latlng.lng;
    if (mapMarker) mapInstance.removeLayer(mapMarker);
    mapMarker = L.marker([selectedLat, selectedLon]).addTo(mapInstance);
    $("#mapCoords").textContent =
      `📍 ${selectedLat.toFixed(4)}, ${selectedLon.toFixed(4)}`;
    $("#showWeatherBtn").style.display = "flex";
  });
}

// Init map when section becomes visible
const mapObserver = new MutationObserver(() => {
  if (sections.map.classList.contains("active") && !mapInstance) {
    initMap();
  }
});
mapObserver.observe(sections.map, { attributes: true, attributeFilter: ["class"] });
// Also try immediately if already active
if (sections.map.classList.contains("active")) initMap();

/* Map search */
$("#mapSearchBtn").addEventListener("click", async () => {
  const q = $("#mapSearchInput").value.trim();
  if (!q) return;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length === 0) { alert("City not found on map."); return; }
    const { lat, lon } = data[0];
    selectedLat = parseFloat(lat);
    selectedLon = parseFloat(lon);
    mapInstance.setView([selectedLat, selectedLon], 12);
    if (mapMarker) mapInstance.removeLayer(mapMarker);
    mapMarker = L.marker([selectedLat, selectedLon]).addTo(mapInstance);
    $("#mapCoords").textContent = `📍 ${selectedLat.toFixed(4)}, ${selectedLon.toFixed(4)}`;
    $("#showWeatherBtn").style.display = "flex";
  } catch (_) { alert("Search failed."); }
});

$("#mapSearchInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("#mapSearchBtn").click(); }
});

/* Map geolocation */
$("#mapGeoBtn").addEventListener("click", () => {
  if (!navigator.geolocation) { alert("Not supported."); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      selectedLat = latitude;
      selectedLon = longitude;
      mapInstance.setView([selectedLat, selectedLon], 12);
      if (mapMarker) mapInstance.removeLayer(mapMarker);
      mapMarker = L.marker([selectedLat, selectedLon]).addTo(mapInstance);
      $("#mapCoords").textContent =
        `📍 ${selectedLat.toFixed(4)}, ${selectedLon.toFixed(4)}`;
      $("#showWeatherBtn").style.display = "flex";
    },
    () => { alert("Could not get location."); }
  );
});

/* Show weather from map */
$("#showWeatherBtn").addEventListener("click", () => {
  if (selectedLat !== null && selectedLon !== null) {
    fetchWeatherByCoords(selectedLat, selectedLon);
    showPage("home");
  }
});

/* ═══════════════════════════════════════════════════════════════
   INIT — load default weather on first visit
   ═══════════════════════════════════════════════════════════════ */
// Show skeleton by default
showSkeleton();

// Try geolocation on first load, fallback to London
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    () => {
      fetchWeather("London");
    }
  );
} else {
  fetchWeather("London");
}
