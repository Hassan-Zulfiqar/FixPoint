const express = require("express");
const app = express();
const path = require("path");

app.set("view engine", "ejs"); // Set EJS as template engine
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

app.get("/", (req, res) => {
    res.render("index");  // Renders views/index.ejs
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
