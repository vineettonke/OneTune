import axios from "axios";

const BASE_URL = "https://api.spotify.com/v1";

const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

const spotify = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add access token to every request
spotify.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserProfile = async () => {
  const res = await spotify.get("/me");
  return res.data;
};

export const getUserPlaylists = async () => {
  const res = await spotify.get("/me/playlists?limit=10");
  return res.data.items;
};

export const getLikedSongs = async () => {
  const res = await spotify.get("/me/tracks?limit=10");
  return res.data.items.map((item) => item.track);
};
