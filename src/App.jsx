import { useEffect, useState } from "react";
import { FiMusic, FiLogIn, FiChevronRight, FiX } from "react-icons/fi";
import { motion } from "framer-motion";

const CLIENT_ID = "ba07961942ce4be4b164c9feaaa33989";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
  "user-read-email",
  "playlist-read-private",
  "user-library-read",
  "user-read-playback-state",
  "user-read-currently-playing",
  "streaming"
].join(" ");

const generateRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((byte) => chars[byte % chars.length])
    .join('');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64UrlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

function App() {
  const [profile, setProfile] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  const fetchWithToken = async (url) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const codeVerifier = generateRandomString(128);
      const hashed = await sha256(codeVerifier);
      const codeChallenge = base64UrlEncode(hashed);

      sessionStorage.setItem("code_verifier", codeVerifier);

      const authUrl = new URL("https://accounts.spotify.com/authorize");
      authUrl.searchParams.append("client_id", CLIENT_ID);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.append("scope", SCOPES);
      authUrl.searchParams.append("code_challenge_method", "S256");
      authUrl.searchParams.append("code_challenge", codeChallenge);

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("code_verifier");
    setProfile(null);
    setPlaylists([]);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [user, userPlaylists] = await Promise.all([
          fetchWithToken("https://api.spotify.com/v1/me"),
          fetchWithToken("https://api.spotify.com/v1/me/playlists?limit=10")
        ]);
        setProfile(user);
        setPlaylists(userPlaylists.items);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("access_token")) loadData();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Poll now playing song every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem("access_token");
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 200) {
          const data = await res.json();
          if (data && data.item) {
            setCurrentTrack(data.item);
          }
        }
      } catch (err) {
        console.error("Failed to fetch currently playing", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Poll playlists every 60s to update real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem("access_token");
      try {
        const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=10", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPlaylists(data.items);
      } catch (err) {
        console.error("Failed to refresh playlists", err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchPlaylistTracks = async (playlistId) => {
    setLoading(true);
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      const data = await response.json();
      setSelectedPlaylist({
        ...playlists.find(p => p.id === playlistId),
        tracks: data.items
      });
    } catch (err) {
      console.error("Error fetching tracks:", err);
    } finally {
      setLoading(false);
    }
  };

  {loading && (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
      <div className="text-white text-2xl font-bold animate-pulse">Loading...</div>
    </div>
  )}
  

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg p-8 rounded-2xl max-w-md w-full text-center border border-white/10 shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Music Hub</h1>
          <button
            onClick={handleLogin}
            className="bg-green-500 hover:bg-green-400 font-bold py-3 px-8 rounded-full w-full transition"
          >
            <FiLogIn className="inline mr-2" /> Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-green-400">Music Hub</h1>
          <p className="text-gray-400">{profile.email}</p>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="ml-auto bg-gray-700 dark:bg-gray-300 text-white dark:text-black px-4 py-2 rounded-lg transition hover:opacity-80"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      {/* Playlist Grid */}
      <div className="flex flex-wrap gap-6 justify-center">
        {playlists.map((playlist) => (
          <motion.div
            key={playlist.id}
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl shadow-lg transition cursor-pointer w-[180px]"
            onClick={() => fetchPlaylistTracks(playlist.id)}
          >
            <div className="relative mb-3">
              {playlist.images?.[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="rounded-lg w-[160px] h-[160px] object-cover mx-auto"
                />
              ) : (
                <div className="w-[160px] h-[160px] bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                  <FiMusic className="text-4xl text-gray-500" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold truncate">{playlist.name}</h3>
            <p className="text-sm text-gray-400">{playlist.tracks.total} tracks</p>
          </motion.div>
        ))}
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 dark:bg-black/20 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-4 shadow-lg">
          <img
            src={currentTrack.album?.images?.[0]?.url}
            alt="Album Art"
            className="w-10 h-10 rounded object-cover"
          />
          <div className="text-left">
            <h4 className="text-sm font-bold">{currentTrack.name}</h4>
            <p className="text-xs text-gray-400">{currentTrack.artists.map(a => a.name).join(", ")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
