// Backend API Routes
import { Group } from '../config/Group.js';
import { Series } from '../config/Series.js';
import { Watchlist } from '../config/Watchlist.js';
// 1. Movie/Series Progress Update - POST /progress/update
export const updateProgress = async (req, res) => {
  try {
    const { groupId, itemId, itemType, userId, completed } = req.body
    console.log("Update progress body:", req.body)

    // Validate required fields
    if (!groupId || !itemId || !itemType || !userId || completed === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    // Find the group
    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      })
    }

    // Get the watchlist doc directly
    const watchlist = await Watchlist.findById(group.watchlist)
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        message: "Watchlist not found",
      })
    }

    if (itemType === "movie") {
      const movieIndex = watchlist.movieList.findIndex(
        (m) => m.movieId.toString() === itemId
      )

      if (movieIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Movie not found in watchlist",
        })
      }

      const userProgressIndex = watchlist.movieList[
        movieIndex
      ].userProgress.findIndex((up) => up.userId.toString() === userId)

      if (userProgressIndex >= 0) {
        watchlist.movieList[movieIndex].userProgress[userProgressIndex].completed =
          completed
      } else {
        watchlist.movieList[movieIndex].userProgress.push({
          userId,
          completed,
          reactions: [],
        })
      }
    } else if (itemType === "series") {
      const seriesIndex = watchlist.seriesList.findIndex(
        (s) => s.seriesId.toString() === itemId
      )

      if (seriesIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Series not found in watchlist",
        })
      }

      const episodeProgressIndex = watchlist.seriesList[
        seriesIndex
      ].episodeProgress.findIndex((ep) => ep.userId.toString() === userId)

      if (episodeProgressIndex >= 0) {
        watchlist.seriesList[seriesIndex].episodeProgress[
          episodeProgressIndex
        ].completed = completed
      } else {
        watchlist.seriesList[seriesIndex].episodeProgress.push({
          userId,
          completed,
          seasonNumber: 0,
          episodeNumber: 0,
          reactions: [],
          comments: [],
        })
      }
    }

    // ✅ Save the watchlist directly
    await watchlist.save()

    res.json({
      success: true,
      message: `${itemType} progress updated successfully`,
      data: { itemId, itemType, userId, completed },
    })
  } catch (error) {
    console.error("Error updating progress:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}

// 2. Episode-specific Toggle - POST /progress/episode-toggle
export const toggleEpisodeCompletion = async (req, res) => {
  try {
    const { seriesId, seasonNumber, episodeNumber, userId, completed, groupId } = req.body;
    
    // 1️⃣ Validate required fields
    if (!seriesId || seasonNumber === undefined || episodeNumber === undefined || !userId || completed === undefined || !groupId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 2️⃣ Find the watchlist for the group (not populate the group)
    let watchlist = await Watchlist.findOne({ groupId });
    
    // If watchlist doesn't exist, create it
    if (!watchlist) {
      watchlist = new Watchlist({
        groupId,
        movieList: [],
        seriesList: []
      });
    }

    // 3️⃣ Find the series in the watchlist
    let seriesListItem = watchlist.seriesList.find(s => s.seriesId.toString() === seriesId);
    
    // If series not in watchlist, add it
    if (!seriesListItem) {
      seriesListItem = {
        seriesId,
        episodeProgress: []
      };
      watchlist.seriesList.push(seriesListItem);
    }

    // 4️⃣ Ensure episodeProgress array exists
    if (!seriesListItem.episodeProgress) {
      seriesListItem.episodeProgress = [];
    }

    // 5️⃣ Find or create user's episode progress
    let epProgress = seriesListItem.episodeProgress.find(
      ep => ep.seasonNumber === seasonNumber &&
            ep.episodeNumber === episodeNumber &&
            ep.userId.toString() === userId
    );

    if (epProgress) {
      epProgress.completed = completed;
    } else {
      seriesListItem.episodeProgress.push({
        seasonNumber,
        episodeNumber,
        userId,
        completed,
        reactions: [],
        comments: []
      });
    }

    // 6️⃣ Fetch series data to calculate season and series completion
    const seriesData = await Series.findById(seriesId);
    if (!seriesData) {
      return res.status(404).json({ success: false, message: "Series data not found" });
    }

    const season = seriesData.seasons.find(s => s.seasonNumber === seasonNumber);

    // Season completion for this user
    let isSeasonComplete = false;
    if (season) {
      const userSeasonProgress = seriesListItem.episodeProgress.filter(
        ep => ep.seasonNumber === seasonNumber && ep.userId.toString() === userId && ep.completed
      );
      isSeasonComplete = userSeasonProgress.length === season.episodes.length;
    }

    // Series completion for this user
    let isSeriesComplete = false;
    if (seriesData.seasons.length > 0) {
      const totalEpisodes = seriesData.seasons.reduce((total, s) => total + s.episodes.length, 0);
      const userTotalProgress = seriesListItem.episodeProgress.filter(
        ep => ep.userId.toString() === userId && ep.completed
      );
      isSeriesComplete = userTotalProgress.length === totalEpisodes;
    }

    // 7️⃣ Save watchlist (not group)
    await watchlist.save();

    // 8️⃣ Send response
    return res.json({
      success: true,
      message: "Episode progress updated",
      data: {
        seriesId,
        seasonNumber,
        episodeNumber,
        userId,
        completed,
        isSeasonComplete,
        isSeriesComplete
      }
    });

  } catch (error) {
    console.error("Error in toggleEpisodeCompletion:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

