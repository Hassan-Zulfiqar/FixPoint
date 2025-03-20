const express = require("express");
const path = require("path");
const sequelize = require("./config/database");
const User = require("./models/User");
const ServiceProvider = require("./models/service_providers");

const app = express();

app.use(express.json()); // Middleware to parse JSON

// Sync all models and create tables
sequelize.sync({ alter: true })
    .then(() => console.log("All tables synchronized with MySQL"))
    .catch(err => console.error("Error syncing tables:", err));

// ✅ Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve the landing page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
