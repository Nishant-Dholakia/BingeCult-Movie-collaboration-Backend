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
    type: omdb.Type || "movie" 
  };
}

async function fetchSeasons(imdbID, totalSeasons) {
  const apiKey = process.env.OMDB_API_KEY;
  const seasons = [];

  for (let seasonNum = 1; seasonNum <= totalSeasons; seasonNum++) {
    try {
      // fetch season overview
      const seasonResp = await axios.get(omdbapi, {
        params: { apikey: apiKey, i: imdbID, Season: seasonNum }
      });

      const seasonData = seasonResp.data;
      if (!seasonData || !seasonData.Episodes) {
        console.warn(`No episodes for season ${seasonNum}`);
        continue;
      }

      // fetch each episode in detail
      const episodes = await Promise.all(
        seasonData.Episodes.map(async ep => {
          try {
            const epResp = await axios.get(omdbapi, {
              params: { apikey: apiKey, i: ep.imdbID }
            });
            const epData = epResp.data || {};

            return {
              episodeNumber: Number(epData.Episode) || Number(ep.Episode) || 0,
              title: epData.Title || ep.Title || "Unknown",
              imdbID: epData.imdbID || ep.imdbID,
              imdbRating: epData.imdbRating || "N/A",
              released: epData.Released || "N/A",
              runtime: epData.Runtime || "N/A",
              plot: epData.Plot || "N/A",
              poster: epData.Poster || "",
              genre: epData.Genre ? epData.Genre.split(",").map(g => g.trim()) : []
            };
          } catch (epErr) {
            console.error(`Episode fetch failed (${ep.imdbID}):`, epErr.message);
            return {
              episodeNumber: Number(ep.Episode) || 0,
              title: ep.Title || "Unknown",
              imdbID: ep.imdbID,
              imdbRating: "N/A",
              released: ep.Released || "N/A",
              runtime: "N/A",
              plot: "N/A",
              poster: "",
              genre: []
            };
          }
        })
      );

      seasons.push({
        seasonNumber: seasonNum,
        episodes
      });
    } catch (seasonErr) {
      console.error(`Season fetch failed (${seasonNum}):`, seasonErr.message);
    }
  }

  return seasons;
}

// --- normalize full series object into schema format ---
export async function mapOmdbToSeriesSchema(omdb) {
  try {
    const totalSeasons = Number(omdb.totalSeasons || 0);
    const seasons = await fetchSeasons(omdb.imdbID, totalSeasons);

    return {
      omdbId: omdb.imdbID,
      title: omdb.Title,
      poster: omdb.Poster || "",
      year: omdb.Year,
      genre: omdb.Genre ? omdb.Genre.split(",").map(g => g.trim()) : [],
      totalSeasons,
      type: "series",
      seasons
    };
  } catch (err) {
    console.error("mapOmdbToSeriesSchema error:", err.message);
    throw new Error("Failed to build series object");
  }
}

export const addToWatchlists = async (req, res) => {
  try {
    let { groupIds, item } = req.body;

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "groupIds is required", data: null });
    }
    if (!item || !item.imdbID || !item.Type) {
      return res
        .status(400)
        .json({ success: false, message: "item (with imdbID and type) required", data: null });
    }

    const type = item.Type === "series" ? "series" : "movie";
    let savedItem = null;

    // Step 1: Check if it already exists
    if (type === "movie") {
      savedItem = await Movie.findOne({ omdbId: item.imdbID });
    } else {
      savedItem = await Series.findOne({ omdbId: item.imdbID });
    }

    //  Step 2: If not found, fetch from OMDB and map
    if (!savedItem) {
      try {
        console.log("\n\nFetching from OMDB for adding to watchlist:\n", item.imdbID);
        const response = await axios.get(omdbapi, {
          params: {
            apikey: process.env.OMDB_API_KEY,
            i: item.imdbID,
          },
        });

        const omdbData = response.data;
        if (!omdbData || omdbData.Response === "False") {
          return res
            .status(404)
            .json({ success: false, message: "OMDB item not found", data: null });
        }

        if (type === "movie") {
          const mappedMovie = mapOmdbToMovieSchema(omdbData);
          savedItem = await Movie.create(mappedMovie);
        } else {
          const mappedSeries = await mapOmdbToSeriesSchema(omdbData); // async
          savedItem = await Series.create(mappedSeries);
        }
      } catch (apiErr) {
        console.error("OMDB fetch error:", apiErr.message);
        return res
          .status(502)
          .json({ success: false, message: "Failed to fetch from OMDB", data: null });
      }
    }

    // Step 3: Add to watchlists for groups
    const results = [];
    for (const gid of groupIds) {
      const groupExists = await Group.exists({ _id: gid });
      if (!groupExists) {
        results.push({ groupId: gid, success: false, reason: "group not found" });
        continue;
      }

      if (type === "movie") {
        await Watchlist.findOneAndUpdate(
          { groupId: gid },
          { $addToSet: { movieList: { movieId: savedItem._id } } },
          { upsert: true, new: true }
        );
      } else {
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
      data: { item: savedItem, results },
    });
  } catch (err) {
    console.error("addToWatchlists error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", data: null });
  }
};

