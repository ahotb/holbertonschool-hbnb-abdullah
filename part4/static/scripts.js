document.addEventListener("DOMContentLoaded", () => {
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
});
