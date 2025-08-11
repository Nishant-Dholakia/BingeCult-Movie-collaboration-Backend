const mongoose = require('mongoose');

// schema for comments
const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

//  User progress for a movie
const userMovieProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  reactions: [{
    type: String,
    enum: ['🔥', '😂', '❤️', '😢', '😡']
  }],
  pollRating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { _id: false });

//  MovieList Schema
const movieListItemSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  userProgress: [userMovieProgressSchema],
  comments: [commentSchema]
}, { _id: false });

//  Episode-level user progress
const episodeProgressSchema = new mongoose.Schema({
  seasonNumber: {
    type: Number,
    required: true
  },
  episodeNumber: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  reactions: [{
    type: String,
    enum: ['🔥', '😂', '❤️', '😢', '😡']
  }],
  pollRating: {
    type: Number,
    min: 1,
    max: 5
  },
  comments: [commentSchema]
}, { _id: false });

//  SeriesList Schema
const seriesListItemSchema = new mongoose.Schema({
  seriesId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Series',
    required: true
  },
  episodeProgress: [episodeProgressSchema]
}, { _id: false });

//  Final Watchlist Schema
const watchlistSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  movieList: [movieListItemSchema],
  seriesList: [seriesListItemSchema]
}, { timestamps: true });

module.exports = mongoose.model("Watchlist", watchlistSchema);





// Watchlist {
//   _id: ObjectId,
//   groupId: ObjectId,        // references Group._id

//   movieList: [              // Group’s watched/added movies
//     {
//       movieId: ObjectId,    // references Movie._id

//       userProgress: [
//         {
//           userId: ObjectId,
//           completed: Boolean,
//           reactions: [String],     // emojis: ["🔥", "😂"]
//           pollRating: Number       // 1–5 stars
//         }
//       ],

//       comments: [
//         {
//           userId: ObjectId,
//           text: String,
//           timestamp: Date
//         }
//       ]
//     }
//   ],

//   seriesList: [             // Group’s tracked series
//     {
//       seriesId: ObjectId,   // references Series._id

//       episodeProgress: [    // per-user, per-episode
//         {
//           seasonNumber: Number,
//           episodeNumber: Number,
//           userId: ObjectId,
//           completed: Boolean,
//           reactions: [String],
//           pollRating: Number,
//           comments: [
//             {
//               userId: ObjectId,
//               text: String,
//               timestamp: Date
//             }
//           ]
//         }
//       ]
//     }
//   ]
// }
