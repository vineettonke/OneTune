import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
console.log("CLIENT ID:", process.env.SPOTIFY_CLIENT_ID);
console.log("CLIENT URI:", process.env.SPOTIFY_CLIENT_SECRET);
const app = express();
app.use(express.json());
app.use(cors());
// Make sure this is at the top, to parse JSON body

app.post('/auth/spotify/callback', async (req, res) => {
  const { code, code_verifier } = req.body;
  
  console.log("Received code:", code);
  console.log("Received verifier:", code_verifier);

  // Validate inputs
  if (!code || !code_verifier) {
    console.error("Missing code or verifier");
    return res.status(400).json({ error: "Missing authorization parameters" });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', 'http://127.0.0.1:5173/callback'); // Updated to match frontend
  params.append('code_verifier', code_verifier);

  try {
    console.log("Sending to Spotify:", params.toString()); // Debug log
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
      },
      body: params
    });

    const data = await response.json();
    console.log("Spotify response:", data); // Debug log
    
    if (data.error) {
      console.error("Spotify error:", data);
      return res.status(400).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
