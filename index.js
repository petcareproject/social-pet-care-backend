const express = require("express");
const connectDb = require('./config/dbConnection')
const path = require("path");
const dotenv = require("dotenv").config();
const cors = require("cors");

connectDb();
const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
const directory = path.join(__dirname, "public");
app.use(express.static(directory));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});