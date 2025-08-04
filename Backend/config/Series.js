const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeNumber: Number,
  title: String,
  imdbID: String,
  released: String,
  runtime: String,
  plot: String
}, { _id: false });

const seasonSchema = new mongoose.Schema({
  seasonNumber: Number,
  episodes: [episodeSchema]
}, { _id: false });

const seriesSchema = new mongoose.Schema({
  omdbId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  poster: String,
  year: String,
  genre: [String],
  totalSeasons: Number,
  type: {
    type: String,
    enum: ['series'],
    default: 'series'
  },
  seasons: [seasonSchema]
});

module.exports = mongoose.model('Series', seriesSchema);
