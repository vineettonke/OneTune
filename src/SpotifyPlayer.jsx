import { useEffect, useState } from 'react';

export default function useSpotifyPlayer(token) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  useEffect(() => {
    if (!token || !window.Spotify) return;

    const newPlayer = new window.Spotify.Player({
      name: 'OneTune Player',
      getOAuthToken: cb => cb(token),
      volume: 0.5,
    });

    newPlayer.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    newPlayer.addListener('player_state_changed', state => {
      if (!state) return;
      setCurrentTrack(state.track_window.current_track);
      setIsPlaying(!state.paused);
    });

    newPlayer.connect();
    setPlayer(newPlayer);
  }, [token]);

  const togglePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.resume();
    }
    setIsPlaying(!isPlaying);
  };

  return { player, isPlaying, currentTrack, togglePlayPause };
}
