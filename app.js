const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads', 'images')));

// Enable CORS for all requests
app.use(cors());

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/user-routes");

const HttpError = require("./models/http-error");

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((error, req, res, next) => {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headersSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mapproject.ogkodq3.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then((result) => {
    console.log("connected!!!");
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => {
    console.log(err);
  });
