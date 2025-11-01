import axios from 'axios';
import { omdbapi, traktapi } from '../api/axios.js';
import {redisClient} from '../config/redisClient.js'
export const getTrendingMovies = async (req, res) => {
  console.log("Fetching trending movies with caching");

  try {
    // 1. Check cache
    const cached = await redisClient.get("trending_movies");
    if (cached) {
      console.log("Serving from Redis cache");
      // console.log(JSON.parse(cached));
      return res.status(200).json({ success: true,message:"Fetched from redis", data: JSON.parse(cached) });
    }

    // 2. Fetch from Trakt API
    const response = await traktapi.get("/movies/trending", { params: { limit: 20 } });
    let trendingMovies = response.data;

    // 3. Fetch OMDB details
    trendingMovies = await Promise.all(
      trendingMovies.map(async (item) => {
        const imdbid = item.movie.ids.imdb;
        const omdbResponse = await axios.get(omdbapi, {
          params: { apikey: process.env.OMDB_API_KEY, i: imdbid },
        });
        return omdbResponse.data;
      })
    );

    // 4. Store in Redis with TTL = 24 hours (86400 seconds)
    await redisClient.setEx("trending_movies", 86400, JSON.stringify(trendingMovies));

    res.status(200).json({ success: true, message:"fetched from api", data: trendingMovies });
  } catch (err) {
    console.error("Error in trending movies:", err);
    res.status(500).json({ success: false, error: "Failed to fetch trending movies" });
  }
};



export const searchMovies = async (req, res) => {
  try {
    const { name, type } = req.query;
    console.log("Searching movies with name:", name, "and type:", type);
    if (!name) {
  return res.status(400).json({ success: false, error: "Movie name is required" });
    }

    const response = await axios.get(omdbapi, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        s: name,
        type: type || "movie",
        plot: "full",
      },
    });

    const data = response.data;

    if (data.Response === "False") {
      return res.status(404).json({ success: false, error: data.Error });
    }

  res.status(200).json({ success: true,message:"Movies fetched successfully", data });
  } catch (e) {
    console.error("Error while fetching movies:", e.message);
  res.status(500).json({ success: false, error: "Something went wrong. Try again later." });
  }
};

export const getMovieDetailsByID = async (req, res) => {
    try{
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, error: "Movie id is required" });
        }
        // console.log(omdbapi);
        const response = await axios.get(omdbapi, {
            params: {
                apikey: process.env.OMDB_API_KEY, 
                i: id,                              // the IMDB ID
            }
        });
  res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
  return res.status(500).json({ success: false, error: "Failed to fetch movie details" });
    }
};