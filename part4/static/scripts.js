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
      <a class="details-button" href="place.html?id=${place.id}">View Details</a>
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

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || params.get("place_id") || "";
}

function displayPlaceDetails(place) {
  const detailsSection = document.getElementById("place-details");
  const reviewsList = document.getElementById("reviews-list");
  const addReviewLink = document.getElementById("add-review-link");
  if (!detailsSection || !reviewsList) {
    return;
  }

  const title = place.title || "Untitled place";
  const owner = place.owner
    ? `${place.owner.first_name || ""} ${place.owner.last_name || ""}`.trim()
    : "Unknown host";
  const price = Number(place.price || 0);
  const description = place.description || "No description available.";
  const amenities = Array.isArray(place.amenities) ? place.amenities : [];
  const reviews = Array.isArray(place.reviews) ? place.reviews : [];

  detailsSection.innerHTML = `
    <h1>${title}</h1>
    <div class="place-info">
      <p><strong>Host:</strong> ${owner}</p>
      <p><strong>Price per night:</strong> $${price}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Amenities:</strong> ${
        amenities.length > 0 ? amenities.map((a) => a.name).join(", ") : "None"
      }</p>
    </div>
  `;

  reviewsList.innerHTML = "";
  if (reviews.length === 0) {
    reviewsList.innerHTML = "<p>No reviews yet.</p>";
  } else {
    reviews.forEach((review) => {
      const reviewCard = document.createElement("article");
      reviewCard.className = "review-card";
      reviewCard.innerHTML = `
        <p>"${review.text || ""}"</p>
        <p><strong>User:</strong> ${review.user_id || "Unknown user"}</p>
        <p><strong>Rating:</strong> ${review.rating || 0}/5</p>
      `;
      reviewsList.appendChild(reviewCard);
    });
  }

  if (addReviewLink && place.id) {
    addReviewLink.href = `add_review.html?place_id=${place.id}`;
  }
}

async function fetchPlaceDetails(token, placeId) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${window.location.origin}/api/v1/places/${placeId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch place details");
  }

  const place = await response.json();
  displayPlaceDetails(place);
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

  const addReviewSection = document.getElementById("add-review");
  if (addReviewSection) {
    addReviewSection.style.display = token ? "block" : "none";

    const placeId = getPlaceIdFromURL();
    const detailsSection = document.getElementById("place-details");
    if (!placeId) {
      if (detailsSection) {
        detailsSection.innerHTML = "<p>Missing place id in URL.</p>";
      }
      return;
    }

    try {
      await fetchPlaceDetails(token, placeId);
    } catch (error) {
      if (detailsSection) {
        detailsSection.innerHTML = "<p>Unable to load place details right now.</p>";
      }
    }
  }
});
