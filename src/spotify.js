export const getAccessToken = () => localStorage.getItem("spotify_access_token");

export const fetchFromSpotify = async (endpoint) => {
  const token = getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const searchSpotify = async (query, type = "track") => {
  const token = getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};