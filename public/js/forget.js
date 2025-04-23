document.addEventListener("DOMContentLoaded", () => {
    const resetForm = document.getElementById("request-reset-form");
    const errorMessage = document.getElementById("error-message");

    resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = resetForm.email.value.trim();
        if (!email) {
            errorMessage.textContent = "Please enter your email!";
            return;
        }

        try {
            const response = await fetch("/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.message || "Something went wrong!";
                return;
            }

            alert("Reset link sent to your email!");
            window.location.href = "/login.html";

        } catch (error) {
            errorMessage.textContent = "Server error. Try again later.";
        }
    });
});
