import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const traktapi = axios.create({
  baseURL: 'https://api.trakt.tv',
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': process.env.TRAKT_CLIENT_ID,
  },
});


export const omdbapi = "https://www.omdbapi.com/";




