/* Part 4 frontend: cookie JWT, fetches API, renders places and reviews. */

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

function getJwtSubject(token) {
  if (!token) return "";
  const payload = parseJwtPayload(token);
  if (payload.sub != null) return String(payload.sub);
  return "";
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
  const adminUsersLink = document.getElementById("admin-users-link");

  const authenticated = Boolean(token);
  const admin = authenticated && isAdmin(token);

  if (loginLink) loginLink.style.display = authenticated ? "none" : "inline-block";
  if (registerLink) registerLink.style.display = authenticated ? "none" : "inline-block";
  if (logoutButton) {
    logoutButton.style.display = authenticated ? "inline-block" : "none";
    logoutButton.onclick = logout;
  }
  if (addPlaceLink) addPlaceLink.style.display = admin ? "inline-block" : "none";
  if (adminUsersLink) adminUsersLink.style.display = admin ? "inline-block" : "none";
}

const DEFAULT_AMENITY_ICON = "/static/images/icon.png";

/** Fixed order for the three gallery icons; any extra (text-only) amenities follow these when saving and displaying. */
const STANDARD_AMENITY_ICON_NAMES = ["WiFi", "Bed", "Bathroom"];

function sortAmenitiesForDisplay(amenities) {
  if (!Array.isArray(amenities) || amenities.length === 0) return [];
  const orderLower = STANDARD_AMENITY_ICON_NAMES.map((n) => n.toLowerCase());
  const tier = (name) => {
    const n = String(name || "").trim().toLowerCase();
    const i = orderLower.indexOf(n);
    return i === -1 ? 1000 : i;
  };
  return [...amenities].sort((a, b) => {
    const ta = tier(a.name);
    const tb = tier(b.name);
    if (ta !== tb) return ta - tb;
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
  });
}

function getAmenityIcon(name) {
  const key = String(name || "").toLowerCase();
  if (key.includes("wifi") || key.includes("wi-fi") || key.includes("internet") || key.includes("wlan")) {
    return "/static/images/icon_wifi.png";
  }
  if (key.includes("bed") || key.includes("bedroom")) {
    return "/static/images/icon_bed.png";
  }
  if (key.includes("bath") || key.includes("shower") || key.includes("tub") || key.includes("toilet")) {
    return "/static/images/icon_bath.png";
  }
  return DEFAULT_AMENITY_ICON;
}

function renderAmenityIcons(amenities) {
  if (!Array.isArray(amenities) || amenities.length === 0) {
    return "<p><strong>Amenities:</strong> None</p>";
  }
  const sorted = sortAmenitiesForDisplay(amenities);
  const amenityItems = sorted
    .map((amenity) => {
      const name = escapeHtml(amenity.name || "Amenity");
      const icon = getAmenityIcon(amenity.name);
      return `<span class="amenity-item"><img class="amenity-icon" src="${icon}" alt="" loading="lazy"><span class="amenity-label">${name}</span></span>`;
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

function reviewStats(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  const ratings = list.map((r) => Number(r.rating)).filter((n) => n >= 1 && n <= 5);
  if (ratings.length === 0) return { count: 0, average: null };
  const sum = ratings.reduce((a, b) => a + b, 0);
  const average = Math.round((sum / ratings.length) * 10) / 10;
  return { count: ratings.length, average };
}

function renderListRatingSummary(reviews) {
  const { count, average } = reviewStats(reviews);
  if (!count || average === null) {
    return `<p class="place-card-rating place-card-rating-empty">No ratings yet</p>`;
  }
  const rounded = Math.round(average);
  return `<div class="place-card-rating">
    ${renderStars(rounded)}
    <span class="rating-average" title="Average ${average} out of 5">${average}/5</span>
    <span class="rating-count">(${count} review${count === 1 ? "" : "s"})</span>
  </div>`;
}

function renderAmenityPreview(amenities, limit = 4) {
  if (!Array.isArray(amenities) || amenities.length === 0) {
    return `<p class="amenities-preview amenities-preview-empty">Amenities: —</p>`;
  }
  const sorted = sortAmenitiesForDisplay(amenities);
  const slice = sorted.slice(0, limit);
  const more = sorted.length - slice.length;
  const icons = slice
    .map((amenity) => {
      const name = escapeHtml(amenity.name || "Amenity");
      const icon = getAmenityIcon(amenity.name);
      return `<span class="amenity-pill" title="${name}"><img class="amenity-icon-sm" src="${icon}" alt="" loading="lazy"><span class="amenity-pill-name">${name}</span></span>`;
    })
    .join("");
  const moreHtml = more > 0 ? ` <span class="amenities-more">+${more} more</span>` : "";
  return `<div class="amenities-preview"><span class="amenities-preview-label">Amenities:</span> ${icons}${moreHtml}</div>`;
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
  let value = String(rawValue || "").trim();
  if (!value) return "";
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  value = value.replace(/^\.\//, "");
  if (value.startsWith("/static/")) return value;
  if (value.startsWith("static/")) return `/${value}`;
  if (value.startsWith("/")) return value;
  return `/static/images/${value.replace(/^\/+/, "")}`;
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

const LISTING_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

let addPlaceListingImageDataUrl = null;
let addPlaceListingImageRemoved = false;

function updateAddPlaceListingPreviewFromState(editSnapshot) {
  const preview = document.getElementById("place_listing_preview");
  const emptyEl = document.getElementById("place_listing_preview_empty");
  const urlInput = document.getElementById("place_listing_image_url");
  if (!preview || !emptyEl) return;

  let src = "";
  if (!addPlaceListingImageRemoved) {
    if (addPlaceListingImageDataUrl) {
      src = addPlaceListingImageDataUrl;
    } else if (urlInput?.value.trim()) {
      src = normalizeImageUrl(urlInput.value.trim());
    } else if (editSnapshot) {
      const r = extractImageUrl(editSnapshot);
      if (r) src = normalizeImageUrl(r);
    }
  }

  if (src) {
    preview.src = src;
    preview.hidden = false;
    emptyEl.hidden = true;
  } else {
    preview.removeAttribute("src");
    preview.hidden = true;
    emptyEl.hidden = false;
  }
}

function getListingImageUrlForSubmit(editSnapshot) {
  if (addPlaceListingImageRemoved) return "";
  if (addPlaceListingImageDataUrl) return addPlaceListingImageDataUrl;
  const url = document.getElementById("place_listing_image_url")?.value.trim() || "";
  if (url) return normalizeImageUrl(url);
  if (editSnapshot) {
    const r = extractImageUrl(editSnapshot);
    return r ? normalizeImageUrl(r) : "";
  }
  return "";
}

function syncAddPlaceListingImageFromPlace(place) {
  addPlaceListingImageDataUrl = null;
  addPlaceListingImageRemoved = false;
  const fileInput = document.getElementById("place_listing_image_file");
  if (fileInput) fileInput.value = "";
  const urlInput = document.getElementById("place_listing_image_url");
  const raw = place ? extractImageUrl(place) : "";
  if (urlInput) {
    if (raw && !String(raw).startsWith("data:")) {
      urlInput.value = String(raw).trim();
    } else {
      urlInput.value = "";
    }
  }
  updateAddPlaceListingPreviewFromState(place || null);
}

function resetAddPlaceListingImageAfterCreate() {
  addPlaceListingImageDataUrl = null;
  addPlaceListingImageRemoved = false;
  const fileInput = document.getElementById("place_listing_image_file");
  if (fileInput) fileInput.value = "";
  const urlInput = document.getElementById("place_listing_image_url");
  if (urlInput) urlInput.value = "";
  updateAddPlaceListingPreviewFromState(null);
}

function readListingImageFile(file, onError, onSuccess) {
  if (!file || !file.type.startsWith("image/")) {
    if (onError) onError("Choose an image file.");
    return;
  }
  if (file.size > LISTING_IMAGE_MAX_BYTES) {
    if (onError) onError("Image must be 2 MB or smaller.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== "string") {
      if (onError) onError("Could not read that file.");
      return;
    }
    addPlaceListingImageDataUrl = result;
    addPlaceListingImageRemoved = false;
    const urlInput = document.getElementById("place_listing_image_url");
    if (urlInput) urlInput.value = "";
    const msg = document.getElementById("add-place-message");
    if (msg) msg.textContent = "";
    if (onSuccess) onSuccess();
  };
  reader.onerror = () => {
    if (onError) onError("Could not read that file.");
  };
  reader.readAsDataURL(file);
}

function wireAddPlaceListingImageControls(getEditSnapshot) {
  const dropzone = document.getElementById("place_listing_dropzone");
  const fileInput = document.getElementById("place_listing_image_file");
  const urlInput = document.getElementById("place_listing_image_url");
  const clearBtn = document.getElementById("place_listing_image_clear");
  if (!dropzone || !fileInput) return;

  const previewUpdate = () => updateAddPlaceListingPreviewFromState(getEditSnapshot());
  const showFileError = (msg) => {
    const box = document.getElementById("add-place-message");
    if (box) box.textContent = msg;
  };

  dropzone.addEventListener("click", (e) => {
    if (e.target === fileInput) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("listing-image-dropzone--active");
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("listing-image-dropzone--active");
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) readListingImageFile(file, showFileError, previewUpdate);
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) readListingImageFile(file, showFileError, previewUpdate);
    fileInput.value = "";
  });

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      addPlaceListingImageDataUrl = null;
      addPlaceListingImageRemoved = false;
      fileInput.value = "";
      previewUpdate();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      addPlaceListingImageRemoved = true;
      addPlaceListingImageDataUrl = null;
      if (urlInput) urlInput.value = "";
      fileInput.value = "";
      previewUpdate();
    });
  }
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || params.get("place_id") || "";
}

function getPostLoginRedirect() {
  const params = new URLSearchParams(window.location.search);
  const raw = (params.get("next") || "").trim();
  if (!raw) return "index.html";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) || raw.startsWith("//")) return "index.html";
  return raw;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  if (!response.ok) {
    const msg = data.error || data.message || data.msg;
    const detail = typeof msg === "string" ? msg : response.status === 401 ? "Not logged in or session expired" : "Request failed";
    throw new Error(detail);
  }
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
    card.className = "place-card place-card--summary";
    card.dataset.price = String(Number(place.price || 0));
    const title = escapeHtml(place.title || "Untitled place");
    const imageUrl = normalizeImageUrl(extractImageUrl(place));
    const photoBlock = imageUrl
      ? `<img class="place-photo" src="${imageUrl}" alt="" loading="lazy">`
      : `<div class="place-photo-placeholder" aria-hidden="true"><span>No photo</span></div>`;

    card.innerHTML = `
      ${photoBlock}
      <div class="place-card-body">
        <h2 class="place-card-title">${title}</h2>
        ${renderListRatingSummary(place.reviews || [])}
        <p class="place-card-line"><strong>Location:</strong> ${escapeHtml(extractLocation(place))}</p>
        <p class="place-card-line place-card-price"><strong>Price / night:</strong> $${Number(place.price || 0)}</p>
        ${renderAmenityPreview(place.amenities || [], 4)}
        <a class="details-button place-card-cta" href="place.html?id=${place.id}">View full details</a>
      </div>
    `;
    container.appendChild(card);
  });

  applyPriceFilter();
}

function displayPlaceDetails(place, token = "") {
  const detailsSection = document.getElementById("place-details");
  const reviewsList = document.getElementById("reviews-list");
  const adminControls = document.getElementById("admin-place-controls");
  if (!detailsSection || !reviewsList) return;

  const owner = place.owner
    ? `${place.owner.first_name || ""} ${place.owner.last_name || ""}`.trim()
    : "Unknown host";
  const imageUrl = normalizeImageUrl(extractImageUrl(place));
  const stats = reviewStats(place.reviews || []);
  const overallRatingHtml =
    stats.count && stats.average !== null
      ? `<p class="place-overall-rating">${renderStars(Math.round(stats.average))} <span class="rating-average">${stats.average}/5</span> <span class="rating-count">(${stats.count} review${stats.count === 1 ? "" : "s"})</span></p>`
      : `<p class="place-overall-rating place-overall-rating-empty">No ratings yet — guests can add the first review below.</p>`;
  const titleSafe = escapeHtml(place.title || "Untitled place");
  const photoBlock = imageUrl
    ? `<img class="place-photo" src="${imageUrl}" alt="" loading="lazy">`
    : `<div class="place-photo-placeholder place-photo-placeholder--detail" aria-hidden="true"><span>No photo</span></div>`;

  detailsSection.innerHTML = `
    <h1>${titleSafe}</h1>
    ${overallRatingHtml}
    <div class="place-info">
      ${photoBlock}
      <p><strong>Host:</strong> ${escapeHtml(owner)}</p>
      <p><strong>Location:</strong> ${escapeHtml(extractLocation(place))}</p>
      <p><strong>Price per night:</strong> $${Number(place.price || 0)}</p>
      <p><strong>Description:</strong> ${escapeHtml(cleanDescription(place.description))}</p>
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
        editBtn.onclick = () => {
          window.location.href = `add_place.html?id=${encodeURIComponent(place.id)}`;
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
      <div class="review-rating">${renderStars(review.rating)}</div>
      <p class="review-text"><strong>Comment:</strong> ${escapeHtml(review.text)}</p>
      <p><strong>User:</strong> ${reviewerName}</p>
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

  configureAddReviewSection(place, token);
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
      window.location.href = getPostLoginRedirect();
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

function updateStarButtons(container, value) {
  const buttons = container.querySelectorAll(".star-btn");
  buttons.forEach((btn, idx) => {
    const v = idx + 1;
    btn.classList.toggle("active", v <= value);
  });
}

function setupStarRatingInput() {
  const container = document.getElementById("star-rating");
  const ratingSelect = document.getElementById("rating");
  if (!container || !ratingSelect) return;

  container.innerHTML = "";
  for (let i = 1; i <= 5; i += 1) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.textContent = "★";
    btn.dataset.value = String(i);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `Rate ${i} out of 5`);
    btn.addEventListener("click", () => {
      ratingSelect.value = String(i);
      ratingSelect.dispatchEvent(new Event("change", { bubbles: true }));
      updateStarButtons(container, i);
      container.querySelectorAll(".star-btn").forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === String(i) ? "true" : "false"));
    });
    container.appendChild(btn);
  }

  ratingSelect.addEventListener("change", () => {
    const n = Number(ratingSelect.value) || 0;
    updateStarButtons(container, n);
  });

  const initial = Number(ratingSelect.value) || 5;
  ratingSelect.value = String(initial);
  updateStarButtons(container, initial);
}

function configureAddReviewSection(place, token) {
  const section = document.getElementById("add-review");
  const link = document.getElementById("add-review-link");
  const hint = document.getElementById("add-review-login-hint");
  const ownerHint = document.getElementById("add-review-owner-hint");
  if (!section) return;

  section.style.display = "block";
  const ownerId = place.owner && place.owner.id != null ? String(place.owner.id) : "";
  const me = getJwtSubject(token);

  if (ownerHint) {
    ownerHint.hidden = true;
    ownerHint.textContent = "";
  }
  if (hint) hint.hidden = true;
  if (link) link.style.display = "none";

  if (!token) {
    if (hint) {
      hint.hidden = false;
      const a = hint.querySelector("a");
      if (a && place.id) {
        a.href = `login.html?next=${encodeURIComponent(`place.html?id=${place.id}`)}`;
      }
    }
    return;
  }

  if (ownerId && me && ownerId === me) {
    if (ownerHint) {
      ownerHint.hidden = false;
      ownerHint.textContent = "As the host, you cannot review your own listing.";
    }
    return;
  }

  if (link) {
    link.style.display = "inline-block";
    link.href = `add_review.html?place_id=${place.id}`;
  }
}

function setupReviewForm(token) {
  const form = document.getElementById("review-form");
  const box = document.getElementById("review-message");
  if (!form) return;

  const boot = async () => {
    setupStarRatingInput();
    if (!token) {
      const qPlace = getPlaceIdFromURL();
      const nextTarget = qPlace ? `add_review.html?place_id=${encodeURIComponent(qPlace)}` : "add_review.html";
      window.location.href = `login.html?next=${encodeURIComponent(nextTarget)}`;
      return;
    }
    const placeId = getPlaceIdFromURL();
    if (!placeId) {
      if (box) box.textContent = "Missing place id in URL.";
      return;
    }

    try {
      const place = await fetchJson(`${window.location.origin}/api/v1/places/${placeId}`, "GET", token);
      const ownerId = place.owner && place.owner.id != null ? String(place.owner.id) : "";
      const me = getJwtSubject(token);
      if (ownerId && me && ownerId === me) {
        if (box) {
          box.textContent =
            "You cannot review your own listing.";
          box.classList.remove("success-message");
        }
        form.style.display = "none";
        return;
      }
    } catch (e) {
      if (box) box.textContent = e.message || "Unable to load place.";
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
      if (!rating || rating < 1 || rating > 5) {
        if (box) box.textContent = "Please choose a star rating (1–5).";
        return;
      }
      try {
        await fetchJson(`${window.location.origin}/api/v1/reviews/`, "POST", token, { text, rating, place_id: placeId });
        window.location.href = `place.html?id=${encodeURIComponent(placeId)}`;
      } catch (error) {
        if (box) box.textContent = error.message || "Failed to submit review.";
      }
    });
  };

  void boot();
}

const AMENITY_ICON_TO_NAME = {
  "icon_wifi.png": "WiFi",
  "icon_bed.png": "Bed",
  "icon_bath.png": "Bathroom",
};

function buildAmenityNameListFromForm(iconFiles) {
  const picked = new Set(iconFiles.map((f) => AMENITY_ICON_TO_NAME[f]).filter(Boolean));
  return STANDARD_AMENITY_ICON_NAMES.filter((n) => picked.has(n));
}

function amenityNameToIconFilename(name) {
  const n = String(name || "").trim().toLowerCase();
  if (n === "wifi" || n === "wi-fi") return "icon_wifi.png";
  if (n === "bed") return "icon_bed.png";
  if (n === "bathroom" || n === "bath") return "icon_bath.png";
  return null;
}

function populateAddPlaceForm(place) {
  const titleEl = document.getElementById("place_title");
  const priceEl = document.getElementById("place_price");
  const cityEl = document.getElementById("place_city");
  const countryEl = document.getElementById("place_country");
  const latEl = document.getElementById("place_latitude");
  const lngEl = document.getElementById("place_longitude");
  const descEl = document.getElementById("place_description");
  if (!titleEl || !place) return;

  titleEl.value = place.title || "";
  if (priceEl) priceEl.value = place.price != null ? String(place.price) : "";
  const loc = extractLocation(place);
  const parts = loc.split(",").map((s) => s.trim());
  if (cityEl) cityEl.value = parts[0] || "";
  if (countryEl) countryEl.value = parts.slice(1).join(", ") || "";
  if (latEl) latEl.value = place.latitude != null ? String(place.latitude) : "";
  if (lngEl) lngEl.value = place.longitude != null ? String(place.longitude) : "";
  if (descEl) descEl.value = cleanDescription(place.description);

  document.querySelectorAll('input[name="amenity_image_pick"]').forEach((cb) => {
    cb.checked = false;
  });
  (place.amenities || []).forEach((a) => {
    const fname = amenityNameToIconFilename(a.name);
    if (fname) {
      const cb = document.querySelector(`input[name="amenity_image_pick"][value="${fname}"]`);
      if (cb) cb.checked = true;
    }
  });
  syncAddPlaceListingImageFromPlace(place);
}

function amenityIdsPreservedFromPlaceWithoutIcons(place) {
  const ids = [];
  (place.amenities || []).forEach((a) => {
    if (!a || !a.id) return;
    if (!amenityNameToIconFilename(a.name)) ids.push(a.id);
  });
  return ids;
}

async function resolveAmenityIdsFromNames(names, token) {
  const seen = new Set();
  const uniqueNames = [];
  names.filter(Boolean).forEach((n) => {
    const k = n.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    uniqueNames.push(n);
  });
  if (uniqueNames.length === 0) return [];

  const list = await fetchJson(`${window.location.origin}/api/v1/amenities`, "GET", "");
  if (!Array.isArray(list)) return [];

  const byLower = {};
  list.forEach((a) => {
    if (a.name) byLower[String(a.name).toLowerCase()] = a.id;
  });

  const ids = [];
  for (const name of uniqueNames) {
    const key = name.toLowerCase();
    let id = byLower[key];
    if (!id) {
      const created = await fetchJson(`${window.location.origin}/api/v1/amenities`, "POST", token, {
        name,
        description: "",
      });
      id = created.id;
      byLower[key] = id;
    }
    ids.push(id);
  }
  return ids;
}

function setupAddPlaceForm(token) {
  const form = document.getElementById("add-place-form");
  const box = document.getElementById("add-place-message");
  if (!form) return;
  if (!token || !isAdmin(token)) {
    window.location.href = "index.html";
    return;
  }

  let editPlaceSnapshot = null;
  let editPlaceId = "";
  let addPlaceFormReady = !getPlaceIdFromURL();

  wireAddPlaceListingImageControls(() => editPlaceSnapshot);
  updateAddPlaceListingPreviewFromState(null);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!addPlaceFormReady) {
      if (box) box.textContent = "Please wait, loading place data…";
      return;
    }
    if (box) {
      box.textContent = "";
      box.classList.remove("success-message");
    }
    const city = document.getElementById("place_city")?.value.trim() || "";
    const country = document.getElementById("place_country")?.value.trim() || "";
    const description = document.getElementById("place_description")?.value.trim() || "";
    const price = Number(document.getElementById("place_price")?.value ?? NaN);
    if (!Number.isFinite(price) || price < 0) {
      if (box) box.textContent = "Enter a valid price.";
      return;
    }

    const iconFiles = [...document.querySelectorAll('input[name="amenity_image_pick"]:checked')].map((el) => el.value);
    const amenityNameList = buildAmenityNameListFromForm(iconFiles);

    try {
      let amenityIds = await resolveAmenityIdsFromNames(amenityNameList, token);
      if (editPlaceId && editPlaceSnapshot) {
        const preserved = amenityIdsPreservedFromPlaceWithoutIcons(editPlaceSnapshot);
        const seen = new Set(amenityIds);
        preserved.forEach((id) => {
          if (!seen.has(id)) {
            amenityIds.push(id);
            seen.add(id);
          }
        });
      }
      const listingImageUrl = getListingImageUrlForSubmit(editPlaceSnapshot);

      const payload = {
        title: document.getElementById("place_title")?.value.trim() || "",
        description: buildPlaceDescription(listingImageUrl, city, country, description),
        price,
        latitude: Number(document.getElementById("place_latitude")?.value || 0),
        longitude: Number(document.getElementById("place_longitude")?.value || 0),
        amenities: amenityIds,
      };

      if (editPlaceId) {
        await fetchJson(`${window.location.origin}/api/v1/places/${editPlaceId}`, "PUT", token, payload);
        window.location.href = `place.html?id=${encodeURIComponent(editPlaceId)}`;
        return;
      }

      await fetchJson(`${window.location.origin}/api/v1/places/`, "POST", token, payload);
      if (box) {
        box.textContent = "Place created successfully.";
        box.classList.add("success-message");
      }
      form.reset();
      resetAddPlaceListingImageAfterCreate();
      document.querySelectorAll('input[name="amenity_image_pick"]').forEach((cb) => {
        cb.checked = false;
      });
    } catch (error) {
      if (box) box.textContent = error.message || "Failed to save place.";
    }
  });

  (async () => {
    const pid = getPlaceIdFromURL();
    if (!pid) return;
    try {
      const place = await fetchJson(`${window.location.origin}/api/v1/places/${pid}`, "GET", token);
      editPlaceSnapshot = place;
      editPlaceId = pid;
      populateAddPlaceForm(place);
      const h = document.getElementById("add-place-heading");
      if (h) h.textContent = "Edit Place";
      const btn = document.getElementById("add-place-submit-btn");
      if (btn) btn.textContent = "Save changes";
      document.title = "HBnB - Edit Place";
    } catch (e) {
      if (box) {
        box.textContent = e.message || "Unable to load place for editing.";
        box.classList.remove("success-message");
      }
      const submitBtn = document.getElementById("add-place-submit-btn");
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    addPlaceFormReady = true;
  })();
}

function setupPlaceBackButton() {
  const btn = document.getElementById("place-back-button");
  if (!btn) return;
  btn.addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

function setupAdminUsersPage(token) {
  const tbody = document.getElementById("admin-users-tbody");
  const countEl = document.getElementById("admin-users-count");
  const searchInput = document.getElementById("admin-users-search");
  const roleFilter = document.getElementById("admin-users-role-filter");
  const applyBtn = document.getElementById("admin-users-apply-filters");
  const msg = document.getElementById("admin-users-message");
  const addForm = document.getElementById("admin-user-add-form");
  const addBlock = document.getElementById("admin-users-add-block");
  const editForm = document.getElementById("admin-user-edit-form");
  const editBlock = document.getElementById("admin-users-edit-block");
  const editCancel = document.getElementById("admin-edit-cancel");
  if (!tbody) return;
  if (!token) {
    window.location.href = `login.html?next=${encodeURIComponent("admin_users.html")}`;
    return;
  }
  if (!isAdmin(token)) {
    window.location.href = "index.html";
    return;
  }

  let lastLoadedUsers = [];

  const flash = (text, ok) => {
    if (!msg) return;
    msg.textContent = text || "";
    msg.classList.toggle("success-message", Boolean(ok));
  };

  const usersUrlWithQuery = () => {
    const params = new URLSearchParams();
    const q = searchInput ? searchInput.value.trim() : "";
    const role = roleFilter ? roleFilter.value : "all";
    if (q) params.set("q", q);
    if (role && role !== "all") params.set("role", role);
    const qs = params.toString();
    const base = `${window.location.origin}/api/v1/users/`;
    return qs ? `${base}?${qs}` : base;
  };

  const bindTableActions = () => {
    const me = getJwtSubject(token);
    tbody.querySelectorAll(".admin-users-btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const user = lastLoadedUsers.find((u) => u.id === id);
        if (!user || !editForm || !editBlock) return;
        if (addBlock) addBlock.open = false;
        const editSummary = editBlock.querySelector("summary");
        if (editSummary) editSummary.textContent = `Edit user: ${user.email || user.id}`;
        document.getElementById("admin-edit-id").value = user.id;
        document.getElementById("admin-edit-first").value = user.first_name || "";
        document.getElementById("admin-edit-last").value = user.last_name || "";
        document.getElementById("admin-edit-email").value = user.email || "";
        document.getElementById("admin-edit-password").value = "";
        document.getElementById("admin-edit-is-admin").checked = Boolean(user.is_admin);
        editBlock.open = true;
        editBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
    tbody.querySelectorAll(".admin-users-btn-delete").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!id || id === me) return;
        const ok = confirm("Delete this user? This also removes their reviews and places.");
        if (!ok) return;
        try {
          await fetchJson(`${window.location.origin}/api/v1/users/${id}`, "DELETE", token);
          flash("User deleted.", true);
          await loadUsers();
        } catch (e) {
          flash(e.message || "Delete failed.", false);
        }
      });
    });
  };

  const renderTable = () => {
    const me = getJwtSubject(token);
    tbody.innerHTML = "";
    lastLoadedUsers.forEach((u) => {
      const tr = document.createElement("tr");
      const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—";
      const isSelf = String(u.id) === String(me);
      const roleCell = u.is_admin ? '<span class="admin-role-badge">Admin</span>' : "Guest";
      tr.innerHTML = `
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(u.email || "")}</td>
        <td>${roleCell}</td>
        <td class="admin-users-actions">
          <button type="button" class="details-button admin-users-btn-edit" data-id="${escapeHtml(u.id)}">Edit</button>
          <button type="button" class="details-button details-button--danger admin-users-btn-delete" data-id="${escapeHtml(
            u.id
          )}" ${isSelf ? "disabled" : ""}>Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });
    if (countEl) countEl.textContent = String(lastLoadedUsers.length);
    bindTableActions();
  };

  const loadUsers = async () => {
    try {
      flash("", false);
      const data = await fetchJson(usersUrlWithQuery(), "GET", token);
      lastLoadedUsers = Array.isArray(data) ? data : [];
      renderTable();
    } catch (e) {
      lastLoadedUsers = [];
      tbody.innerHTML = "";
      if (countEl) countEl.textContent = "0";
      flash(e.message || "Unable to load users.", false);
    }
  };

  if (applyBtn) applyBtn.addEventListener("click", () => void loadUsers());
  if (roleFilter) roleFilter.addEventListener("change", () => void loadUsers());
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void loadUsers();
      }
    });
  }

  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const first = document.getElementById("admin-add-first")?.value.trim() || "";
      const last = document.getElementById("admin-add-last")?.value.trim() || "";
      const email = document.getElementById("admin-add-email")?.value.trim() || "";
      const password = document.getElementById("admin-add-password")?.value || "";
      const adminCb = document.getElementById("admin-add-is-admin");
      try {
        await fetchJson(`${window.location.origin}/api/v1/users/`, "POST", token, {
          first_name: first,
          last_name: last,
          email,
          password,
          is_admin: Boolean(adminCb?.checked),
        });
        addForm.reset();
        flash("User created.", true);
        await loadUsers();
      } catch (err) {
        flash(err.message || "Could not create user.", false);
      }
    });
  }

  const resetEditSummary = () => {
    const editSummary = editBlock?.querySelector("summary");
    if (editSummary) editSummary.textContent = "Edit user";
  };

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("admin-edit-id")?.value;
      if (!id) return;
      const payload = {
        first_name: document.getElementById("admin-edit-first")?.value.trim() || "",
        last_name: document.getElementById("admin-edit-last")?.value.trim() || "",
        email: document.getElementById("admin-edit-email")?.value.trim() || "",
        is_admin: Boolean(document.getElementById("admin-edit-is-admin")?.checked),
      };
      const pw = document.getElementById("admin-edit-password")?.value || "";
      if (pw) payload.password = pw;
      try {
        await fetchJson(`${window.location.origin}/api/v1/users/${id}`, "PUT", token, payload);
        if (editBlock) {
          editBlock.open = false;
          resetEditSummary();
        }
        flash("User updated.", true);
        await loadUsers();
      } catch (err) {
        flash(err.message || "Could not update user.", false);
      }
    });
  }

  if (editCancel && editBlock) {
    editCancel.addEventListener("click", () => {
      editBlock.open = false;
      resetEditSummary();
      flash("", false);
    });
  }

  if (addBlock && editBlock) {
    addBlock.addEventListener("toggle", () => {
      if (addBlock.open) editBlock.open = false;
    });
    editBlock.addEventListener("toggle", () => {
      if (editBlock.open) addBlock.open = false;
      if (!editBlock.open) resetEditSummary();
    });
  }

  void loadUsers();
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = getCookie("token");
  setupPlaceBackButton();
  setHeaderVisibility(token);

  setupLoginForm();
  setupRegisterForm();
  setupPriceFilter();
  setupReviewForm(token);
  setupAddPlaceForm(token);
  setupAdminUsersPage(token);

  if (document.getElementById("places-list")) {
    try {
      const places = await fetchJson(`${window.location.origin}/api/v1/places/`, "GET", token);
      displayPlaces(Array.isArray(places) ? places : []);
    } catch (error) {
      document.getElementById("places-list").innerHTML = "<p>Unable to load places right now.</p>";
    }
  }

  const detailsSection = document.getElementById("place-details");
  if (detailsSection) {
    const placeId = getPlaceIdFromURL();
    if (!placeId) {
      detailsSection.innerHTML = "<p>Missing place id in URL.</p>";
      return;
    }
    const addSection = document.getElementById("add-review");
    if (addSection) addSection.style.display = "none";
    try {
      const place = await fetchJson(`${window.location.origin}/api/v1/places/${placeId}`, "GET", token);
      displayPlaceDetails(place, token);
    } catch (error) {
      detailsSection.innerHTML = "<p>Unable to load place details right now.</p>";
    }
  }
});
