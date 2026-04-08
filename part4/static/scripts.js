function getCookie(name) {
  const prefix = `${name}=`;
  const parts = document.cookie.split(";");
  for (let i = 0; i < parts.length; i += 1) {
    const cookie = parts[i].trim();
    if (cookie.startsWith(prefix)) return cookie.substring(prefix.length);
  }
  return "";
}

function parseJwtPayload(token) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return {};
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (error) {
    return {};
  }
}

function isAdmin(token) {
  const payload = parseJwtPayload(token);
  return Boolean(payload.is_admin);
}

function logout() {
  document.cookie = "token=; Max-Age=0; path=/; SameSite=Lax";
  window.location.href = "index.html";
}

function setHeaderVisibility(token) {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const logoutButton = document.getElementById("logout-button");
  const addPlaceLink = document.getElementById("add-place-link");

  const authenticated = Boolean(token);
  const admin = authenticated && isAdmin(token);

  if (loginLink) loginLink.style.display = authenticated ? "none" : "inline-block";
  if (registerLink) registerLink.style.display = authenticated ? "none" : "inline-block";
  if (logoutButton) {
    logoutButton.style.display = authenticated ? "inline-block" : "none";
    logoutButton.onclick = logout;
  }
  if (addPlaceLink) addPlaceLink.style.display = admin ? "inline-block" : "none";
}

function getAmenityIcon(name) {
  const key = String(name || "").toLowerCase();
  if (key.includes("wifi")) return "/static/images/icon_wifi.png";
  if (key.includes("bed")) return "/static/images/icon_bed.png";
  if (key.includes("bath")) return "/static/images/icon_bath.png";
  return "";
}

function renderAmenityIcons(amenities) {
  if (!Array.isArray(amenities) || amenities.length === 0) {
    return "<p><strong>Amenities:</strong> None</p>";
  }
  const amenityItems = amenities
    .map((amenity) => {
      const name = amenity.name || "Amenity";
      const icon = getAmenityIcon(name);
      if (!icon) return `<span class="amenity-label">${name}</span>`;
      return `<span class="amenity-item"><img class="amenity-icon" src="${icon}" alt="${name} icon"><span class="amenity-label">${name}</span></span>`;
    })
    .join("");
  return `<div class="amenities-row"><strong>Amenities:</strong> ${amenityItems}</div>`;
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = "★".repeat(r);
  const empty = "☆".repeat(5 - r);
  return `<span class="stars" aria-label="rating ${r} out of 5">${full}${empty}</span>`;
}

function extractLocation(place) {
  const city = place.city || place.location_city;
  const country = place.country || place.location_country;
  if (city || country) return `${city || "-"}, ${country || "-"}`;

  const description = String(place.description || "");
  const match = description.match(/\[Location:\s*([^,]+),\s*([^\]]+)\]/i);
  if (match) return `${match[1].trim()}, ${match[2].trim()}`;
  return "City/Country not specified";
}

function extractImageUrl(place) {
  const explicit = place.image_url || place.image || "";
  if (explicit) return explicit;
  const description = String(place.description || "");
  const match = description.match(/\[Image:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : "";
}

function normalizeImageUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/static/images/${value}`;
}

function cleanDescription(description) {
  return String(description || "")
    .replace(/\[Image:\s*([^\]]+)\]\s*/i, "")
    .replace(/\[Location:\s*([^\]]+)\]\s*/i, "")
    .trim() || "No description available.";
}

function buildPlaceDescription(imageUrl, city, country, description) {
  return `[Image: ${imageUrl || ""}] [Location: ${city || ""}, ${country || ""}] ${description || ""}`.trim();
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || params.get("place_id") || "";
}

async function fetchJson(url, method = "GET", token = "", body = null) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function applyPriceFilter() {
  const filter = document.getElementById("price-filter");
  const cards = document.querySelectorAll("#places-list .place-card");
  if (!filter) return;
  cards.forEach((card) => {
    const price = Number(card.dataset.price || 0);
    const max = filter.value;
    card.style.display = max === "all" || price <= Number(max) ? "block" : "none";
  });
}

function displayPlaces(places) {
  const container = document.getElementById("places-list");
  if (!container) return;
  container.innerHTML = "";

  places.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.dataset.price = String(Number(place.price || 0));
    const description = cleanDescription(place.description);
    const imageUrl = normalizeImageUrl(extractImageUrl(place));
    card.innerHTML = `
      <h2>${place.title || "Untitled place"}</h2>
      ${imageUrl ? `<img class="place-photo" src="${imageUrl}" alt="${place.title || "Place"} image">` : ""}
      <p>${description}</p>
      <p><strong>Location:</strong> ${extractLocation(place)}</p>
      <p><strong>Price per night:</strong> $${Number(place.price || 0)}</p>
      ${renderAmenityIcons(place.amenities || [])}
      <a class="details-button" href="place.html?id=${place.id}">View Details</a>
    `;
    container.appendChild(card);
  });

  applyPriceFilter();
}

function displayPlaceDetails(place, token = "") {
  const detailsSection = document.getElementById("place-details");
  const reviewsList = document.getElementById("reviews-list");
  const addReviewLink = document.getElementById("add-review-link");
  const adminControls = document.getElementById("admin-place-controls");
  if (!detailsSection || !reviewsList) return;

  const owner = place.owner
    ? `${place.owner.first_name || ""} ${place.owner.last_name || ""}`.trim()
    : "Unknown host";
  const imageUrl = normalizeImageUrl(extractImageUrl(place));
  detailsSection.innerHTML = `
    <h1>${place.title || "Untitled place"}</h1>
    <div class="place-info">
      ${imageUrl ? `<img class="place-photo" src="${imageUrl}" alt="${place.title || "Place"} image">` : ""}
      <p><strong>Host:</strong> ${owner}</p>
      <p><strong>Location:</strong> ${extractLocation(place)}</p>
      <p><strong>Price per night:</strong> $${Number(place.price || 0)}</p>
      <p><strong>Description:</strong> ${cleanDescription(place.description)}</p>
      ${renderAmenityIcons(place.amenities || [])}
    </div>
  `;

  if (adminControls) {
    adminControls.innerHTML = "";
    if (token && isAdmin(token)) {
      adminControls.innerHTML = `
        <button id="edit-place-button" class="details-button" type="button">Edit Place</button>
        <button id="delete-place-button" class="details-button" type="button">Delete Place</button>
      `;

      const editBtn = document.getElementById("edit-place-button");
      const deleteBtn = document.getElementById("delete-place-button");

      if (editBtn) {
        editBtn.onclick = async () => {
          const title = prompt("New title", place.title || "");
          if (title === null) return;
          const city = prompt("City", (extractLocation(place).split(",")[0] || "").trim());
          if (city === null) return;
          const country = prompt("Country", (extractLocation(place).split(",")[1] || "").trim());
          if (country === null) return;
          const imageUrl = prompt("Image URL", normalizeImageUrl(extractImageUrl(place)));
          if (imageUrl === null) return;
          const description = prompt("Description", cleanDescription(place.description));
          if (description === null) return;
          const price = Number(prompt("Price per night", String(place.price || 0)));
          const latitude = Number(prompt("Latitude", String(place.latitude || 0)));
          const longitude = Number(prompt("Longitude", String(place.longitude || 0)));

          try {
            await fetchJson(`${window.location.origin}/api/v1/places/${place.id}`, "PUT", token, {
              title,
              description: buildPlaceDescription(normalizeImageUrl(imageUrl), city, country, description),
              price,
              latitude,
              longitude,
            });
            const refreshed = await fetchJson(`${window.location.origin}/api/v1/places/${place.id}`, "GET", token);
            displayPlaceDetails(refreshed, token);
          } catch (error) {
            alert(error.message || "Failed to update place.");
          }
        };
      }

      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          const ok = confirm("Delete this place?");
          if (!ok) return;
          try {
            await fetchJson(`${window.location.origin}/api/v1/places/${place.id}`, "DELETE", token);
            window.location.href = "index.html";
          } catch (error) {
            alert(error.message || "Failed to delete place.");
          }
        };
      }
    }
  }

  const reviews = Array.isArray(place.reviews) ? place.reviews : [];
  reviewsList.innerHTML = reviews.length === 0 ? "<p>No reviews yet.</p>" : "";
  reviews.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";
    const reviewerName = `${review.user_first_name || ""} ${review.user_last_name || ""}`.trim() || review.user_id || "Unknown user";
    card.innerHTML = `
      <p>"${review.text || ""}"</p>
      <p><strong>User:</strong> ${reviewerName}</p>
      <p><strong>Rating:</strong> ${renderStars(review.rating)}</p>
      ${token && isAdmin(token) ? `<button class="details-button review-edit" data-review-id="${review.id}" type="button">Edit</button> <button class="details-button review-delete" data-review-id="${review.id}" type="button">Delete</button>` : ""}
    `;
    reviewsList.appendChild(card);
  });

  if (token && isAdmin(token)) {
    reviewsList.querySelectorAll(".review-edit").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const reviewId = btn.getAttribute("data-review-id");
        const review = reviews.find((r) => r.id === reviewId);
        if (!review) return;
        const text = prompt("Edit review text", review.text || "");
        if (text === null) return;
        const rating = Number(prompt("Edit rating (1-5)", String(review.rating || 5)));
        try {
          await fetchJson(`${window.location.origin}/api/v1/reviews/${reviewId}`, "PUT", token, { text, rating });
          const refreshed = await fetchJson(`${window.location.origin}/api/v1/places/${place.id}`, "GET", token);
          displayPlaceDetails(refreshed, token);
        } catch (error) {
          alert(error.message || "Failed to update review.");
        }
      });
    });

    reviewsList.querySelectorAll(".review-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const reviewId = btn.getAttribute("data-review-id");
        const ok = confirm("Delete this review?");
        if (!ok) return;
        try {
          await fetchJson(`${window.location.origin}/api/v1/reviews/${reviewId}`, "DELETE", token);
          const refreshed = await fetchJson(`${window.location.origin}/api/v1/places/${place.id}`, "GET", token);
          displayPlaceDetails(refreshed, token);
        } catch (error) {
          alert(error.message || "Failed to delete review.");
        }
      });
    });
  }

  if (addReviewLink && place.id) addReviewLink.href = `add_review.html?place_id=${place.id}`;
}

function setupPriceFilter() {
  const filter = document.getElementById("price-filter");
  if (filter) filter.addEventListener("change", applyPriceFilter);
}

function setupLoginForm() {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.textContent = "";

    const email = document.getElementById("email")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    try {
      const data = await fetchJson(`${window.location.origin}/api/v1/users/login`, "POST", "", { email, password });
      document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
      window.location.href = "index.html";
    } catch (error) {
      if (errorBox) errorBox.textContent = error.message || "Login failed.";
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById("register-form");
  const box = document.getElementById("register-message");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (box) {
      box.textContent = "";
      box.classList.remove("success-message");
    }
    const payload = {
      first_name: document.getElementById("first_name")?.value.trim() || "",
      last_name: document.getElementById("last_name")?.value.trim() || "",
      email: document.getElementById("register_email")?.value.trim() || "",
      password: document.getElementById("register_password")?.value || "",
    };
    try {
      await fetchJson(`${window.location.origin}/api/v1/users/register`, "POST", "", payload);
      if (box) {
        box.textContent = "Account created successfully. You can login now.";
        box.classList.add("success-message");
      }
      form.reset();
    } catch (error) {
      if (box) box.textContent = error.message || "Failed to create account.";
    }
  });
}

function setupReviewForm(token) {
  const form = document.getElementById("review-form");
  const box = document.getElementById("review-message");
  if (!form) return;
  if (!token) {
    window.location.href = "index.html";
    return;
  }
  const placeId = getPlaceIdFromURL();
  if (!placeId) {
    if (box) box.textContent = "Missing place id in URL.";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (box) {
      box.textContent = "";
      box.classList.remove("success-message");
    }
    const text = document.getElementById("comment")?.value.trim() || "";
    const rating = Number(document.getElementById("rating")?.value || 0);
    try {
      await fetchJson(`${window.location.origin}/api/v1/reviews/`, "POST", token, { text, rating, place_id: placeId });
      if (box) {
        box.textContent = "Review submitted successfully!";
        box.classList.add("success-message");
      }
      form.reset();
    } catch (error) {
      if (box) box.textContent = error.message || "Failed to submit review.";
    }
  });
}

function setupAddPlaceForm(token) {
  const form = document.getElementById("add-place-form");
  const box = document.getElementById("add-place-message");
  if (!form) return;
  if (!token || !isAdmin(token)) {
    window.location.href = "index.html";
    return;
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (box) {
      box.textContent = "";
      box.classList.remove("success-message");
    }
    const city = document.getElementById("place_city")?.value.trim() || "";
    const country = document.getElementById("place_country")?.value.trim() || "";
    const imageUrl = normalizeImageUrl(document.getElementById("place_image_url")?.value.trim() || "");
    const amenityIdsRaw = document.getElementById("place_amenity_ids")?.value.trim() || "";
    const amenityIds = amenityIdsRaw ? amenityIdsRaw.split(",").map((v) => v.trim()).filter(Boolean) : [];
    const description = document.getElementById("place_description")?.value.trim() || "";
    const payload = {
      title: document.getElementById("place_title")?.value.trim() || "",
      description: buildPlaceDescription(imageUrl, city, country, description),
      price: Number(document.getElementById("place_price")?.value || 0),
      latitude: Number(document.getElementById("place_latitude")?.value || 0),
      longitude: Number(document.getElementById("place_longitude")?.value || 0),
      amenities: amenityIds,
    };
    try {
      await fetchJson(`${window.location.origin}/api/v1/places/`, "POST", token, payload);
      if (box) {
        box.textContent = "Place created successfully.";
        box.classList.add("success-message");
      }
      form.reset();
    } catch (error) {
      if (box) box.textContent = error.message || "Failed to create place.";
    }
  });
}

function setupAmenityForm(token) {
  const form = document.getElementById("amenity-form");
  const box = document.getElementById("amenity-message");
  if (!form) return;
  if (!token || !isAdmin(token)) {
    form.style.display = "none";
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (box) {
      box.textContent = "";
      box.classList.remove("success-message");
    }
    const name = document.getElementById("amenity_name")?.value.trim() || "";
    const description = document.getElementById("amenity_description")?.value.trim() || "";
    try {
      await fetchJson(`${window.location.origin}/api/v1/amenities`, "POST", token, { name, description });
      if (box) {
        box.textContent = "Amenity created successfully.";
        box.classList.add("success-message");
      }
      form.reset();
    } catch (error) {
      if (box) box.textContent = error.message || "Failed to create amenity.";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getCookie("token");
  setHeaderVisibility(token);

  setupLoginForm();
  setupRegisterForm();
  setupPriceFilter();
  setupReviewForm(token);
  setupAddPlaceForm(token);
  setupAmenityForm(token);

  if (document.getElementById("places-list")) {
    try {
      const places = await fetchJson(`${window.location.origin}/api/v1/places/`, "GET", token);
      displayPlaces(Array.isArray(places) ? places : []);
    } catch (error) {
      document.getElementById("places-list").innerHTML = "<p>Unable to load places right now.</p>";
    }
  }

  const addReviewSection = document.getElementById("add-review");
  if (addReviewSection) addReviewSection.style.display = token && isAdmin(token) ? "block" : "none";

  const detailsSection = document.getElementById("place-details");
  if (detailsSection) {
    const placeId = getPlaceIdFromURL();
    if (!placeId) {
      detailsSection.innerHTML = "<p>Missing place id in URL.</p>";
      return;
    }
    try {
      const place = await fetchJson(`${window.location.origin}/api/v1/places/${placeId}`, "GET", token);
      displayPlaceDetails(place, token);
    } catch (error) {
      detailsSection.innerHTML = "<p>Unable to load place details right now.</p>";
    }
  }
});
