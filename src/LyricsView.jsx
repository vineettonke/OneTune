import React, { useEffect, useState } from 'react';

const LyricsView = ({ track }) => {
  const [lyrics, setLyrics] = useState('Fetching lyrics...');

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${track.artists[0].name}/${track.name}`);
        const data = await res.json();
        setLyrics(data.lyrics || 'Lyrics not found.');
      } catch (err) {
        setLyrics('Error fetching lyrics.');
        console.error(err);
      }
    };

    fetchLyrics();
  }, [track]);

  return (
    <div className="mt-6 whitespace-pre-wrap text-gray-300">
      <h2 className="text-xl font-semibold mb-2">Lyrics</h2>
      <p>{lyrics}</p>
    </div>
  );
};

export default LyricsView;
