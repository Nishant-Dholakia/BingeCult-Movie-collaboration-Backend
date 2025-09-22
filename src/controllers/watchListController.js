import { Watchlist} from "../config/Watchlist.js"
import { Series } from "../config/Series.js";
import { Group } from "../config/Group.js";
import { Movie } from "../config/Movie.js";
import {omdbapi} from '../api/axios.js';
import axios from "axios";
// i got a watchlist id
export const getWholeWatchlist = async (listid) =>{
    let watchlist = await Watchlist.findById(listid).select('-__v -updatedAt');
    // console.log(watchlist);
    if(!watchlist)
        return null;
    for(let seriesEntry of watchlist.seriesList){
        let series = await Series.findById(seriesEntry.seriesId).select('-__v -updatedAt');
        seriesEntry.seriesId = series;
    }
    for(let movieEntry of watchlist.movieList){
        let movie = await Movie.findById(movieEntry.movieId).select('-__v -updatedAt');
        movieEntry.movieId = movie;
    }
    return watchlist;
};

const initializeEpisodeProgress = (series, userIds) => {
  const episodeProgress = [];

  for (const season of series.seasons) {
    for (const episode of season.episodes) {
      for (const userId of userIds) {
        episodeProgress.push({
          seasonNumber: season.seasonNumber,
          episodeNumber: episode.episodeNumber,
          userId,
          completed: false,
          reactions: [],
          pollRating: null,
          comments: []
        });
      }
    }
  }

  return episodeProgress;
};


export const addSeries = async (req, res) => {
  console.log("Entered addSeries controller");
  try {
    const { groupId, seriesData } = req.body;

    if (!groupId || !seriesData?.omdbId) {
      return res.status(400).json({
        success: false,
        message: "Missing groupId or seriesData.omdbId",
        data: null
      });
    }
    // console.log("Received seriesData:", seriesData);
    // console.log("Received groupId:", groupId);
    // 1. Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
        data: null
      });
    }
    // console.log("Group found:", group);
    // 2. Check if series exists in DB
    let series = await Series.findOne({ omdbId: seriesData.omdbId });
    if (!series) {
      series = await Series.create(seriesData);
    }
    // console.log("Series found/created:", series);
    // 3. Initialize episodeProgress for each userId in group.members
    const userIds = group.members; 
    const episodeProgress = initializeEpisodeProgress(series, userIds);
    // console.log("Initialized episodeProgress:", episodeProgress);
    // 4. Add series to watchlist
    const watchlist = await Watchlist.findOneAndUpdate(
      { groupId },
      {
        $addToSet: {
          seriesList: { seriesId: series._id, episodeProgress }
        }
      },
      { new: true, upsert: true }
    );
    // console.log("Updated watchlist:", watchlist);
    return res.status(200).json({
      success: true,
      message: "Series added to watchlist successfully",
      data: watchlist
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null
    });
  }
};


const initializeMovieProgress = (userIds) => {
  return userIds.map((userId) => ({
    userId,
    completed: false,
    reactions: [],
    pollRating: null,
  }));
};

export const addMovie = async (req, res) => {
  console.log("Entered addMovie controller");
  try {
    const { groupId, movieData } = req.body;

    if (!groupId || !movieData?.omdbId) {
      return res.status(400).json({
        success: false,
        message: "Missing groupId or movieData.omdbId",
        data: null,
      });
    }

    console.log("Received movieData:", movieData);
    console.log("Received groupId:", groupId);

    // 1. Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
        data: null,
      });
    }

    console.log("Group found:", group);

    // 2. Check if movie exists in DB
    let movie = await Movie.findOne({ omdbId: movieData.omdbId });
    if (!movie) {
      movie = await Movie.create(movieData);
    }

    console.log("Movie found/created:", movie);

    // 3. Initialize userProgress for each userId in group.members
    const userIds = group.members;
    const userProgress = initializeMovieProgress(userIds);

    // 4. Add movie to watchlist
    const watchlist = await Watchlist.findOneAndUpdate(
      { _id: group.watchlist._id },
      {
        $addToSet: {
          movieList: {
            movieId: movie._id,
            userProgress,
            comments: [],
          },
        },
      },
      { new: true, upsert: true }
    );

    console.log("Updated watchlist:", watchlist);

    return res.status(200).json({
      success: true,
      message: "Movie added to watchlist successfully",
      data: watchlist,
    });
  } catch (err) {
    console.error("Error in addMovie:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null,
    });
  }
};


export const getWatchlistById = async (req,res)=>{
    let {watchlistId} = req.query;
    if(!watchlistId)
      return res.status(400).json({success:false,message:"Watchlist ID is required..."});
    console.log("Watchlist ID from query:", watchlistId);
    let watchlist = await getWholeWatchlist(watchlistId);
    if(!watchlist)
        return res.status(400).json({success:false,message:"Watchlist not found..."});

    res.status(200).json({message : "Watchlist fetched...",success:true,data : watchlist});
}


function mapOmdbToMovieSchema(omdb) {
  if (!omdb || omdb.Response === "False") {
    throw new Error("Invalid OMDB response");
  }

  return {
    omdbId: omdb.imdbID || "",
    title: omdb.Title || "",
    year: omdb.Year || "",
    genre: omdb.Genre ? omdb.Genre.split(",").map(g => g.trim()) : [],
    poster: omdb.Poster && omdb.Poster !== "N/A" ? omdb.Poster : "",
    runtime: omdb.Runtime && omdb.Runtime !== "N/A" ? omdb.Runtime : "00:00:00",
    type: omdb.Type === "series" ? "movie" : omdb.Type || "movie" // fallback to "movie"
  };
}

export const addToWatchlists = async (req, res) => {
  try {
    let { groupIds, item } = req.body;
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ success:false, message: "groupIds is required", data:null });
    }
    if (!item || !item.imdbID || !item.Type) {
      return res.status(400).json({ success:false, message: "item (with imdbID and type) required", data:null });
    }
    const response = await axios.get(omdbapi,{
                params: {
                    apikey: process.env.OMDB_API_KEY,
                    i: item.imdbID,
                }
            });
            console.log("OMDB response:", response.data);
    item = response.data;
    // normalize
    const type = item.Type === "series" ? "series" : "movie";
    let savedItem = null;
item = mapOmdbToMovieSchema(item);
    // Upsert in Movie/Series collection
    if (type === "movie") {
      savedItem = await Movie.findOne({ omdbId: item.omdbId });
      if (!savedItem) {
        
        savedItem = await Movie.create(item);
      }
    } else {
      savedItem = await Series.findOne({ omdbId: item.omdbId });
      if (!savedItem) {
        savedItem = await Series.create(item);
      }
    }

    // For each group id: add to watchlist (atomic-ish). Use $addToSet to avoid duplicates.
    const results = [];
    for (const gid of groupIds) {
      // optional: verify group exists and user is admin — do this before calling endpoint if necessary
      const groupExists = await Group.exists({ _id: gid });
      if (!groupExists) {
        results.push({ groupId: gid, success:false, reason: "group not found" });
        continue;
      }

      if (type === "movie") {
        await Watchlist.findOneAndUpdate(
          { groupId: gid },
          { $addToSet: { movieList: { movieId: savedItem._id } } },
          { upsert: true, new: true }
        );
      } else {
        // initialize empty episodeProgress for now — you can compute per group members if needed elsewhere
        await Watchlist.findOneAndUpdate(
          { groupId: gid },
          { $addToSet: { seriesList: { seriesId: savedItem._id } } },
          { upsert: true, new: true }
        );
      }
      results.push({ groupId: gid, success: true });
    }

    return res.json({
      success: true,
      message: "Added item to watchlists",
      data: { item: savedItem, results }
    });
  } catch (err) {
    console.error("addToWatchlists error:", err);
    return res.status(500).json({ success:false, message: "Server error", data: null });
  }
};
