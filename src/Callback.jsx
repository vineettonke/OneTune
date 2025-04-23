import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiLoader } from 'react-icons/fi';

function Callback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const code_verifier = sessionStorage.getItem('code_verifier');
    
    if (code) {
      axios.post('http://localhost:5000/auth/spotify/callback', { code, code_verifier })
        .then((res) => {
          localStorage.setItem('access_token', res.data.access_token);
          window.location.href = '/';
        })
        .catch((err) => {
          console.error('Failed to fetch token:', err);
          window.location.href = '/?error=auth_failed';
        });
    } else {
      window.location.href = '/?error=no_code';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white">
      <div className="text-center">
        <FiLoader className="animate-spin text-4xl mb-4 mx-auto text-spotify-green" />
        <h2 className="text-xl font-medium">Connecting to Spotify...</h2>
        <p className="text-gray-400 mt-2">Please wait while we authenticate</p>
      </div>
    </div>
  );
}

export default Callback;