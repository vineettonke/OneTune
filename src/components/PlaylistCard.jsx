// components/PlaylistCard.jsx
import { FiChevronRight, FiMusic } from "react-icons/fi";

export default function PlaylistCard({ playlist, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-2xl p-4 hover:bg-gray-700 transition group cursor-pointer border border-gray-700 shadow-sm"
    >
      <div className="relative mb-4">
        {playlist.images?.[0]?.url ? (
          <img
            src={playlist.images[0].url}
            alt={playlist.name}
            className="w-full aspect-square object-cover rounded-lg"
          />
        ) : (
          <div className="w-full aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
            <FiMusic className="text-4xl text-gray-500" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg">
          <FiChevronRight className="text-2xl text-blue-400" />
        </div>
      </div>
      <h3 className="font-semibold truncate text-white">{playlist.name}</h3>
      <p className="text-sm text-gray-400 truncate">
        {playlist.tracks.total} tracks
      </p>
    </div>
  );
}
