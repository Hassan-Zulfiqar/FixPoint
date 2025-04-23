document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("reset-form");
    const errorMessage = document.getElementById("error-message");

    // Extract token from URL
    const token = new URLSearchParams(window.location.search).get("token");

    if (!token) {
        errorMessage.textContent = "Invalid or expired reset link.";
        return;
    }

    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = resetForm.password.value.trim();

        if (newPassword.length < 6) {
            errorMessage.textContent = "Password must be at least 6 characters!";
            return;
        }

        try {
            const response = await fetch(`/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.message || "Something went wrong!";
                return;
            }

            alert("Password reset successful! You can now log in.");
            window.location.href = "/login.html";

        } catch (error) {
            errorMessage.textContent = "Server error. Try again later.";
        }
    });
});
