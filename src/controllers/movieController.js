import axios from 'axios';
import { omdbapi, traktapi } from '../api/axios.js';

export const getTrendingMovies = async (req, res) => {
    console.log("Fetching trending movies from Trakt API");
  try {
    const response = await traktapi.get("/movies/trending", {
                    params: { limit: 10 },
                    });

    var trendingMovies = response.data;
    trendingMovies = await Promise.all(trendingMovies.map(async item => {
        
        const imdbid = item.movie.ids.imdb;
        // console.log("Fetching OMDB data for IMDB ID:", imdbid);
        const response = await axios.get(omdbapi, {
            params: {
                apikey: process.env.OMDB_API_KEY, 
                i: imdbid,                              
            }
        });
        
        // console.log("OMDB response:", response.data);

        return response.data;
    }));
    res.status(200).json(trendingMovies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
};


export const getMovieDetailsByID = async (req, res) => {
    try{
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ error: "Movie id is required" });
        }
        // console.log(omdbapi);
        const response = await axios.get(omdbapi, {
            params: {
                apikey: process.env.OMDB_API_KEY, 
                i: id,                              // the IMDB ID
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        return res.status(500).json({ error: "Failed to fetch movie details" });
    }
};

export const searchMovies = async (req, res) => {
  try {
    const { name, type } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Movie name is required" });
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
      return res.status(404).json({ error: data.Error });
    }

    res.status(200).json(data);
  } catch (e) {
    console.error("Error while fetching movies:", e.message);
    res.status(500).json({ error: "Something went wrong. Try again later." });
  }
};


