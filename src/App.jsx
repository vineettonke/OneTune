import { useEffect, useState } from "react";
import PlaylistCard from "./components/PlaylistCard";
import { FiMusic, FiUser, FiLogIn, FiChevronRight, FiX } from "react-icons/fi";

const CLIENT_ID = "ba07961942ce4be4b164c9feaaa33989";
const REDIRECT_URI = "http://127.0.0.1:5173/callback";
const SCOPES = [
  "user-read-email",
  "playlist-read-private",
  "user-library-read"
].join(" ");

// PKCE Implementation
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

  const fetchWithToken = async (url) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      setError(err.message);
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
      setError("Login initialization failed");
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
    setLikedSongs([]);
  };

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);

    const loadData = async () => {
      setLoading(true);
      try {
        const [user, userPlaylists, likedTracks] = await Promise.all([
          fetchWithToken("https://api.spotify.com/v1/me"),
          fetchWithToken("https://api.spotify.com/v1/me/playlists?limit=10"),
          fetchWithToken("https://api.spotify.com/v1/me/tracks?limit=20")
        ]);
        
        setProfile(user);
        setPlaylists(userPlaylists.items);
        setLikedSongs(likedTracks.items.map(item => item.track));
      } catch (err) {
        console.error("Data loading error:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("access_token")) loadData();
  }, [darkMode]);


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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full text-center border border-gray-700">
          <h1 className="text-3xl font-bold mb-6 text-blue-400">Music Hub</h1>
          <button
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-500 font-bold py-3 px-8 rounded-full w-full transition"
          >
            <FiLogIn className="inline mr-2" />
            Login with Spotify
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="ml-auto bg-gray-700 dark:bg-gray-300 text-white dark:text-black px-4 py-2 rounded-lg shadow transition hover:opacity-80">
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    );
  }
  

  return (
    
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">Music Hub</h1>
          <p className="text-gray-400">{profile.email}</p>
        </div>
      </header>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {playlists.map((playlist) => (
          <div 
            key={playlist.id}
            onClick={() => fetchPlaylistTracks(playlist.id)}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition cursor-pointer group border border-gray-700"
          >
            <div className="relative mb-4">
              {playlist.images?.[0]?.url ? (
                <img 
                  src={playlist.images[0].url} 
                  alt={playlist.name}
                  className="w-full aspect-square object-cover rounded"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-700 rounded flex items-center justify-center">
                  <FiMusic className="text-4xl text-gray-500" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <FiChevronRight className="text-2xl text-blue-400" />
              </div>
            </div>
            <h3 className="font-bold truncate">{playlist.name}</h3>
            <p className="text-sm text-gray-400">{playlist.tracks.total} tracks</p>
          </div>
        ))}
      </div>

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-blue-400">{selectedPlaylist.name}</h2>
              <button 
                onClick={() => setSelectedPlaylist(null)}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[70vh]">
              {/* Playlist Info */}
              <div className="flex items-start p-4 gap-4">
                {selectedPlaylist.images?.[0]?.url ? (
                  <img
                    src={selectedPlaylist.images[0].url}
                    alt={selectedPlaylist.name}
                    className="w-24 h-24 rounded object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded bg-gray-700 flex items-center justify-center">
                    <FiMusic className="text-3xl text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Playlist • {selectedPlaylist.owner.display_name}</p>
                  <p className="text-gray-300">{selectedPlaylist.tracks.total} tracks</p>
                </div>
              </div>

              {/* Tracks List */}
              <div className="divide-y divide-gray-700">
                {selectedPlaylist.tracks?.map((item, index) => (
                  <div key={item.track.id} className="p-3 hover:bg-gray-700/50 transition flex items-center gap-3">
                    <span className="text-gray-400 w-6 text-right">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.track.name}</h3>
                      <p className="text-sm text-gray-400 truncate">
                        {item.track.artists.map(a => a.name).join(", ")}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.track.duration_ms).toISOString().substr(14, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;