function getCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (let i = 0; i < parts.length; i += 1) {
    const cookie = parts[i].trim();
    if (cookie.startsWith(prefix)) {
      return cookie.substring(prefix.length);
    }
  }
  return "";
}

function setLoginVisibility() {
  const loginLink = document.getElementById("login-link");
  if (!loginLink) {
    return "";
  }
  const token = getCookie("token");
  loginLink.style.display = token ? "none" : "inline-block";
  return token;
}

function applyPriceFilter() {
  const filter = document.getElementById("price-filter");
  const cards = document.querySelectorAll("#places-list .place-card");
  if (!filter || cards.length === 0) {
    return;
  }

  const maxPrice = filter.value;
  cards.forEach((card) => {
    const rawPrice = Number(card.dataset.price || 0);
    const shouldShow = maxPrice === "all" || rawPrice <= Number(maxPrice);
    card.style.display = shouldShow ? "block" : "none";
  });
}

function displayPlaces(places) {
  const placesList = document.getElementById("places-list");
  if (!placesList) {
    return;
  }

  placesList.innerHTML = "";

  places.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    const price = Number(place.price || 0);
    card.dataset.price = String(price);

    const title = place.title || "Untitled place";
    const description = place.description || "No description available.";
    const lat = place.latitude ?? "-";
    const lng = place.longitude ?? "-";

    card.innerHTML = `
      <h2>${title}</h2>
      <p>${description}</p>
      <p><strong>Location:</strong> ${lat}, ${lng}</p>
      <p><strong>Price per night:</strong> $${price}</p>
      <a class="details-button" href="place.html">View Details</a>
    `;
    placesList.appendChild(card);
  });

  applyPriceFilter();
}

async function fetchPlaces(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${window.location.origin}/api/v1/places/`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch places");
  }

  const places = await response.json();
  displayPlaces(Array.isArray(places) ? places : []);
}

function setupLoginForm() {
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (errorBox) {
      errorBox.textContent = "";
    }

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    try {
      const response = await fetch(`${window.location.origin}/api/v1/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.access_token) {
        const message = data.error || "Login failed. Please check your credentials.";
        if (errorBox) {
          errorBox.textContent = message;
        }
        return;
      }

      document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
      window.location.href = "index.html";
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = "Unable to reach the server. Please try again.";
      }
    }
  });
}

function setupPriceFilter() {
  const filter = document.getElementById("price-filter");
  if (!filter) {
    return;
  }
  filter.addEventListener("change", applyPriceFilter);
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = setLoginVisibility();
  setupLoginForm();
  setupPriceFilter();

  if (document.getElementById("places-list")) {
    try {
      await fetchPlaces(token);
    } catch (error) {
      const placesList = document.getElementById("places-list");
      if (placesList) {
        placesList.innerHTML = "<p>Unable to load places right now.</p>";
      }
    }
  }
});
