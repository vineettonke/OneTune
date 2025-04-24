export default function NowPlayingBar({ track }) {
    if (!track) return null;
  
    return (
      <div className="fixed bottom-0 w-full bg-gray-900 text-white flex justify-between items-center p-4">
        <div>
          <div className="font-bold">{track.name}</div>
          <div className="text-sm text-gray-400">{track.artists?.[0]?.name}</div>
        </div>
        <button className="px-3 py-1 bg-green-600 rounded">❤️</button>
      </div>
    );
  }