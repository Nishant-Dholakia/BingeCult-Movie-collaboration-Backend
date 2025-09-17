import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  omdbId: {
    type: String,
    required: true,
    unique: true,
    trim: true // trims whitespace
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: String, // OMDb often gives year as "2010–2015" for series
    required: true
  },
  genre: [{
    type: String,
    trim: true
  }],
  poster: {
    type: String,
    default: "" // fallback in case of missing poster
  },
  runtime: {
    type: String,
    default: "00:00:00" // default runtime if not provided
  },
  type: {
    type: String,
    enum: ["movie"],
    default: "movie"
  }
}, { timestamps: true });

export const Movie = mongoose.model("Movie", movieSchema);


// Movie {
//   _id: ObjectId,
//   omdbId: String,           // IMDb ID like "tt1234567"
//   title: String,
//   year: String,
//   genre: [String],
//   poster: String,
//   runtime: String,
//   type: "movie"
// }
