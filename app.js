const DEFAULT = { name: "Boca Raton", lat: 26.3683, lon: -80.1289 };

const CODES = {
  0: ["Clear", "☀️"], 1: ["Mostly Clear", "🌤️"], 2: ["Partly Cloudy", "⛅"], 3: ["Cloudy", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Fog", "🌫️"],
  51: ["Drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Drizzle", "🌦️"],
  56: ["Freezing Drizzle", "🌧️"], 57: ["Freezing Drizzle", "🌧️"],
  61: ["Rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy Rain", "🌧️"],
  66: ["Freezing Rain", "🌧️"], 67: ["Freezing Rain", "🌧️"],
  71: ["Snow", "🌨️"], 73: ["Snow", "🌨️"], 75: ["Heavy Snow", "❄️"], 77: ["Snow Grains", "🌨️"],
  80: ["Showers", "🌦️"], 81: ["Showers", "🌦️"], 82: ["Heavy Showers", "⛈️"],
  85: ["Snow Showers", "🌨️"], 86: ["Snow Showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};
const weather = (code) => CODES[code] || ["—", "🌡️"];
const $ = (id) => document.getElementById(id);

async function load({ name, lat, lon }) {
  $("place").textContent = name;
  $("desc").textContent = "Loading…";

  const url = "https://api.open-meteo.com/v1/forecast?" + new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: 7,
  });

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    render(await res.json());
  } catch {
    $("desc").textContent = "Couldn't load weather";
  }
}

function render(data) {
  const c = data.current;
  const d = data.daily;
  const [desc] = weather(c.weather_code);

  $("temp").textContent = `${Math.round(c.temperature_2m)}°`;
  $("desc").textContent = desc;
  $("hilo").textContent = `H:${Math.round(d.temperature_2m_max[0])}°  L:${Math.round(d.temperature_2m_min[0])}°`;
  $("feels").textContent = `${Math.round(c.apparent_temperature)}°`;
  $("humidity").textContent = `${c.relative_humidity_2m}%`;
  $("wind").textContent = `${Math.round(c.wind_speed_10m)} mph`;
  $("uv").textContent = Math.round(d.uv_index_max[0]);

  // Next 24 hours, starting from the current hour
  const start = Math.max(0, data.hourly.time.findIndex((t) => t >= c.time.slice(0, 13)));
  $("hourly").innerHTML = data.hourly.time.slice(start, start + 24).map((t, i) => {
    const h = new Date(t).getHours();
    const label = i === 0 ? "Now" : `${h % 12 || 12}${h < 12 ? "AM" : "PM"}`;
    return `<div class="hour">
      <span>${label}</span>
      <span class="icon">${weather(data.hourly.weather_code[start + i])[1]}</span>
      <span>${Math.round(data.hourly.temperature_2m[start + i])}°</span>
    </div>`;
  }).join("");

  $("daily").innerHTML = d.time.map((t, i) => {
    const day = i === 0 ? "Today" : new Date(t + "T00:00").toLocaleDateString("en-US", { weekday: "short" });
    return `<li>
      <span>${day}</span>
      <span class="icon">${weather(d.weather_code[i])[1]}</span>
      <span class="range"><span class="lo">${Math.round(d.temperature_2m_min[i])}°</span>${Math.round(d.temperature_2m_max[i])}°</span>
    </li>`;
  }).join("");
}

$("search").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = $("query").value.trim();
  if (!q) return;

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(q)}`);
    const { results } = await res.json();
    if (!results?.length) {
      $("desc").textContent = "City not found";
      return;
    }
    const r = results[0];
    load({ name: r.name, lat: r.latitude, lon: r.longitude });
    $("query").value = "";
  } catch {
    $("desc").textContent = "Search failed";
  }
});

load(DEFAULT);
