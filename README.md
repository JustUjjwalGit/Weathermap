# 🌦️ Weathermap

![Webpage Design](./Webpage%20design.png)

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-28a745?style=for-the-badge)](https://github.com/UjjwalOnGit/Weathermap)

---

## Overview

**Weathermap** is a premium, real-time weather dashboard built as a personal learning project. It provides current weather conditions, hourly & 7-day forecasts, an interactive map, and air quality data — all wrapped in a clean, dark-themed interface inspired by modern design.

---

## Features

- **Current Weather** — temperature, feels like, humidity, pressure, visibility, wind, UV index
- **Hourly & 7‑Day Forecast** — scrollable hourly, daily aggregates with icons
- **Interactive Map** — click any location or search a city, then view its weather
- **Air Quality Index** — from OpenWeatherMap's air pollution API
- **Dark / Light Theme** — animated switcher with localStorage persistence
- **Geolocation** — one‑click weather for your current position
- **Responsive** — mobile, tablet, and desktop layouts
- **Skeleton Loading** — placeholder animations while data loads
- **Animated Background** — subtle glow & noise texture

## Tech Stack

- **HTML5** – Semantics & structure
- **CSS3** – Custom properties, glassmorphism, animations, responsive grid
- **JavaScript (ES6)** – Async API calls, SPA navigation, DOM manipulation
- **OpenWeatherMap API** – Weather, forecast & air pollution data
- **[Leaflet.js](https://leafletjs.com/)** – Interactive map with OpenStreetMap tiles
- **Font Awesome** – Icons

---

## Getting Started

1. **Clone the repo:**

   ```bash
   git clone https://github.com/UjjwalOnGit/Weathermap.git
   cd Weathermap
   ```

2. **Open `index.html`** in your browser (or use Live Server in VS Code).

No build tools, no dependencies — just open and go.

---

## Project Structure

```
Weathermap/
├── index.html        ← main app (SPA with all sections)
├── style.css         ← all styles (themes, layout, animations)
├── main.js           ← all logic (API, map, theme, navigation)
├── svg/              ← weather icons and UI assets
└── README.md
```

---

_Originally created as a learning project to explore working with APIs, asynchronous JavaScript, responsive design, and building a polished UI from scratch._
