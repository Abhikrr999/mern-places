const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const helmet = require("helmet");

app.use(helmet());
app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images'))); 

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});


const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/user-routes");

const HttpError = require("./models/http-error");

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

// app.use((req, res, next) => {
//   const error = new HttpError("Could not find this route", 404);
//   throw error;
// });

// app.use((error, req, res, next) => {
//   // error middleware

//   if (req.file.path) {
//     fs.unlink(req.file.path, (err) => {
//       console.log(err);
//     });
//   }

//   if (res.headersSent) {
//     return next(error);
//   }
//   res.status(error.code || 500);
//   res.json({ message: error.message || "An unknown error occured" });
// });

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
