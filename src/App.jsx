// App.jsx with Spotify Web Playback SDK + Now Playing Bar 
import { useEffect, useState, useRef } from "react";
import './App.css';
import PlaylistCard from "./components/PlaylistCard";
import { FiMusic, FiLogIn, FiLogOut } from "react-icons/fi";

const CLIENT_ID = "ba07961942ce4be4b164c9feaaa33989";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "playlist-read-private",
  "user-library-read",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state"
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
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [player, setPlayer] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("access_token");
  const fetchWithToken = async (url) => {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  };

  const handleLogin = async () => {
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
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("code_verifier");
    setProfile(null);
    setPlaylists([]);
  };

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const code = query.get("code");
    const verifier = sessionStorage.getItem("code_verifier");
    const existingToken = localStorage.getItem("access_token");

    const fetchToken = async () => {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
          code_verifier: verifier
        })
      });
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      window.history.replaceState({}, document.title, "/");
      window.location.reload();
    };

    if (!existingToken && code && verifier) fetchToken();
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const [me, myPlaylists] = await Promise.all([
          fetchWithToken("https://api.spotify.com/v1/me"),
          fetchWithToken("https://api.spotify.com/v1/me/playlists?limit=10")
        ]);
        setProfile(me);
        setPlaylists(myPlaylists.items);
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const transferPlaybackHere = async (device_id) => {
    await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ device_ids: [device_id], play: false })
    });
  };

  useEffect(() => {
    if (!token || window.Spotify === undefined) return;
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const _player = new window.Spotify.Player({
        name: "OneTune Player",
        getOAuthToken: cb => cb(token),
        volume: 0.5
      });
      setPlayer(_player);

      _player.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        transferPlaybackHere(device_id);
      });

      _player.addListener("player_state_changed", state => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setPaused(state.paused);
      });

      _player.connect();
    };
  }, [token]);

  const handlePlay = async (uri) => {
    await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ uris: [uri] })
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center border border-gray-700">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">OneTune</h1>
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-500 font-bold py-3 px-8 rounded-full w-full transition"
          >
            <FiLogIn className="inline mr-2" />
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-400">OneTune 🎵</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{profile.display_name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            <FiLogOut className="inline mr-1" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.id} playlist={playlist} onPlay={handlePlay} />
        ))}
      </div>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 flex items-center gap-4 shadow-lg">
          <img
            src={currentTrack.album.images[0].url}
            alt={currentTrack.name}
            className="w-16 h-16 object-cover rounded mb-2"
          />
          <div className="flex-1">
            <div className="font-semibold truncate">{currentTrack.name}</div>
            <div className="text-sm text-gray-400 truncate">
              {currentTrack.artists.map(a => a.name).join(", ")}
            </div>
          </div>
          <button
            onClick={() => player.togglePlay()}
            className="bg-blue-500 px-4 py-2 rounded text-white"
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
