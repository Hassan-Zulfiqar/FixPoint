document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-form").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form from reloading the page

        var formData = new FormData(this);
        var jsonData = JSON.stringify(Object.fromEntries(formData));

        fetch("/login", {
            method: "POST",
            body: jsonData,
            headers: { "Content-Type": "application/json" }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (data.message === "Login successful!") {
                // Redirect based on user type
                if (data.user_type === "service_provider") {
                    window.location.href = "/service/provider_dashboard.html";
                } else {
                    // Default for customer user type
                    window.location.href = "/user/user_dashboard.html";
                }
            } else {
                document.getElementById("error-message").textContent = data.message; // Show error in <p>
            }
        })
        .catch(function (error) {
            console.error("Login Error:", error);
        });
    });
});
