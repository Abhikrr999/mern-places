const fs  = require('fs');

const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place-model");
const User = require("../models/user-model");


exports.getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId); // findById() in mongoose doesn't give a promise, we are awaiting it just coz it is an async task to search for a lace by id and might take some time.
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject( {getters: true  }) });
};

/* exports.getPlacesByUserId = async(req, res, next) => {
//   const userId = req.params.uid;

//  let places;
//  try {
//   places = await Place.find({creator: userId});
//   console.log(places);
//  }catch(err){
//   const error = new HttpError(
//     "Fetching Places failed",
//     500
//   );
//   return next(error);
//  }

//   if (places.length === 0) {
//     const error = new Error("Could not find a place for the provided user id", 404)
//     return next(error)
//   }
//   res.json({ places: places.map(place => place.toObject({getters:true})) });
// };
//
*/

// alternative method with populate() method
exports.getPlacesByUserId = async(req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate('places');
  } catch(err) {
    const error = new HttpError('Fetching places failed', 500);
    return next(error);
  }

if(!userWithPlaces || userWithPlaces.places.length === 0){
  return next(new HttpError("Could not find places for the provided user id", 404));
}

res.json({ places: userWithPlaces.places.map(place => place.toObject({getters:true})) });

}

exports.createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
   return next(new HttpError("Invalid inputs passed, please check your data.", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  // const title = req.body.title;
  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: coordinates,
    creator,
  });

let user;

try {
user = await User.findById(creator);

} catch(err) {
  const error = new HttpError("Creating Place Failed", 500);
  return next(error);
}

if(!user) {
  const error = new HttpError("We could not find user for provided Id", 404);
  return next(error);
}

console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    createdPlace.save({session: sess});
    user.places.push(createdPlace);
    await user.save({session:sess});
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating Place failed, try again", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

exports.updatePlace = async (req, res, next) => {
  const { title, description } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error =  new HttpError("Invalid Inputs Passed", 422);
    return next(error);
  }

  const placeId = req.params.pid;

 let place; 

 try{
  place = await Place.findById(placeId);
 }catch(err){
  const error = new HttpError("Could not update, something went wrong", 500);
  return next(error);
 }

 // the below comparison will ensure that the user who is logged in, and is trying to edit the place, created that place. 

 if(place.creator.toString() !== req.userData.userId) {     // this req.userData.userId is coming from route protection middleware check-auth.js
  const error = new HttpError("You are not allowed to edit this place", 401);
  return next(error);
 }
place.title = title;
place.description = description;

try {
  await place.save();
}catch(err){
  const error = new HttpError("Could not update, something went wrong", 500);
  return next(error);
}
  res.status(200).json({ place: place.toObject({getters:true})});
};

exports.deletePlace = async(req, res, next) => {
  const placeId = req.params.pid;

let place;
try {
  place = await Place.findById(placeId).populate('creator');
}catch(err){
  const error = new HttpError('Something went wrong, couldnot delete place' , 500);
  return next(error);
}

if(!place) {
  const error = new HttpError("Could not find place for this id", 404);
  return next(error);
}

if (place.creator.id !== req.userData.userId){
  const error = new HttpError("You are not allowed to edit this place", 401);
  return next(error);
}

const imagePath = place.image;


try {
  const sess = await mongoose.startSession();
  sess.startTransaction();
  await place.deleteOne({session:sess});
  place.creator.places.pull(place);
  await place.creator.save({session : sess});
  await sess.commitTransaction();
} catch (err){
  const error = new HttpError('Something went wrong, couldnot delete place' , 500);
  return next(error);
}
fs.unlink(imagePath, err => {
  console.log(err);
});  

  res.status(200).json({ message: "Deleted Place" });
};

