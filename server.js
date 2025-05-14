const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("./config/pass");
const connectDB = require("./config/database");
const authRoutes = require("./routes/auth_routes");
const userRoutes = require('./routes/userRoutes');
const providerServiceRoutes = require('./routes/providerServiceRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(session({ 
    secret: process.env.secret_key, 
    resave: false, 
    saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// Use API routes first with proper prefix
app.use('/api/user', userRoutes);
app.use('/api/provider/services', providerServiceRoutes);

// Serve HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use authentication routes
app.use("/", authRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});