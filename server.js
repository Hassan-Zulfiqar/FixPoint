const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("./config/pass");
const sequelize = require("./config/database");
const authRoutes = require("./routes/auth_routes");

const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: process.env.secret_key, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Sync database models
sequelize.sync()
    .then(() => console.log("All tables synchronized with MySQL"))
    .catch(err => console.error("Error syncing tables:", err));

// Serve HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use authentication routes
app.use("/", authRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
