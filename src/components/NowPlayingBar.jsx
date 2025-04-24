import React, { useEffect, useState } from 'react';

const NowPlayingBar = ({ player, currentTrack, isPlaying, onTogglePlayPause }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      player.getCurrentState().then(state => {
        if (state) {
          const percent = (state.position / state.duration) * 100;
          setProgress(percent);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl w-[300px] mx-auto">
      <div className="text-center font-semibold">
        {currentTrack ? `${currentTrack.name} – ${currentTrack.artists.map(a => a.name).join(', ')}` : 'Nothing playing'}
      </div>
      <div className="w-full h-2 bg-gray-600 rounded mt-2 mb-4 overflow-hidden">
        <div className="h-2 bg-green-500" style={{ width: `${progress}%` }} />
      </div>
      <button
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full"
        onClick={onTogglePlayPause}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
};

export default NowPlayingBar;
