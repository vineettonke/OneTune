import { useState } from 'react';
import { searchSpotify } from './spotify';

export default function SearchPage({ onPlay }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const data = await searchSpotify(query);
    setResults(data.tracks?.items || []);
  };

  return (
    <div className="p-4">
      <input
        className="p-2 border border-gray-600 bg-gray-800 text-white w-full"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search songs..."
      />
      <button onClick={handleSearch} className="mt-2 px-4 py-2 bg-green-600 text-white">Search</button>
      <div className="grid gap-4 mt-4">
        {results.map(track => (
          <div key={track.id} className="bg-gray-800 p-4 rounded shadow cursor-pointer" onClick={() => onPlay(track.uri)}>
            <p className="text-white font-semibold">{track.name}</p>
            <p className="text-gray-400 text-sm">{track.artists[0].name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}