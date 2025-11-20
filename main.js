const APIKey = "d9e2f08a5cbb73d08a34ce3d5739a56b";
const APIurl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const inputBox = document.querySelector(".form__group input");
const inputBtn = document.getElementById("btn");
const weatherIcon = document.getElementById("weatherImage");

// ================== Weather by city name ==================
async function checkweather(city) {
    const response = await fetch(APIurl + city + `&appid=${APIKey}`);
    const output = await response.json();
    console.log(output);
    if (document.getElementById("location")) {
        document.getElementById("location").innerHTML = output.name;
        document.getElementById("temp").innerHTML = Math.floor(output.main.feels_like) + "°";
        document.getElementById("highTemp").innerHTML = "High: " + Math.round(output.main.temp_max) + "°";
        document.getElementById("lowTemp").innerHTML = "Low: " + Math.round(output.main.temp_min) + "°";
        document.getElementById("weatherCondetion").innerHTML = output.weather[0].description;
    }

    if (weatherIcon) {
        const icons = {
            "Clouds": "clouds.png",
            "Clear": "clear.png",
            "Drizzle": "drizzle.png",
            "Rain": "rain.png",
            "Mist": "mist.png"
        };
        const iconName = icons[output.weather[0].main] || "clouds.png";
        weatherIcon.src = "svg/" + iconName;
    }
}

// =============== Weather by coordinates (used by map) ================
async function checkweatherByCoords(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${APIKey}`);
    const output = await response.json();

    if (document.getElementById("location")) {
        document.getElementById("location").innerHTML = output.name;
        document.getElementById("temp").innerHTML = Math.floor(output.main.feels_like) + "°";
        document.getElementById("highTemp").innerHTML = "High: " + Math.round(output.main.temp_max) + "°";
        document.getElementById("lowTemp").innerHTML = "Low: " + Math.round(output.main.temp_min) + "°";
        document.getElementById("weatherCondetion").innerHTML = output.weather[0].description;
    }

  
    if (output.weather[0].main == "Clouds") {
        weatherIcon.src = "svg/clouds.png";

    } else if(output.weather[0].main == "Clear"){
        weatherIcon.src = "svg/clear.png";

    }else if(output.weather[0].main == "Drizzle"){
        weatherIcon.src = "svg/drizzle.png";

    }else if(output.weather[0].main == "Rain"){
        weatherIcon.src = "svg/rain.png";

    }else if(output.weather[0].main == "Mist"){
        weatherIcon.src = "svg/mist.png";
    }      
}


// =============== Handle Search by Button or Enter ===============
if (inputBtn && inputBox) {
    inputBtn.addEventListener("click", () => {
        checkweather(inputBox.value);
    });

    inputBox.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            inputBtn.click();
        }
    });
}

// =================== If on map.html, show map ===================
if (document.getElementById("map")) {
    const map = L.map('map').setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    // When user clicks on map, store coordinates in localStorage
    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        if (marker) map.removeLayer(marker);
        marker = L.marker([lat, lon]).addTo(map);

        localStorage.setItem("selectedLat", lat);
        localStorage.setItem("selectedLon", lon);
    });

    // Handle "Show Temp" button
    const showTempBtn = document.getElementById("showTempBtn");
    if (showTempBtn) {
        showTempBtn.addEventListener("click", () => {
            const lat = localStorage.getItem("selectedLat");
            const lon = localStorage.getItem("selectedLon");

            if (lat && lon) {
                window.location.href = "index.html";
            } else {
                alert("Please click on the map to select a location first.");
            }
        });
    }
}

// ============= When index.html loads, check if coords exist =============
window.addEventListener("DOMContentLoaded", () => {
    const lat = localStorage.getItem("selectedLat");
    const lon = localStorage.getItem("selectedLon");

    if (lat && lon) {
        checkweatherByCoords(lat, lon);
        localStorage.removeItem("selectedLat");
        localStorage.removeItem("selectedLon");
    }
});

document.getElementById("cityInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    let city = e.target.value;
    if (city.trim() !== "") {
      checkweather(city);
      document.getElementById("overlay").style.display = "none";
    }
  }
});
