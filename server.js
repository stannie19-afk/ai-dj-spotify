// Dependencies laden
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');  //
require('dotenv').config();

// App initialiseren
const app = express();
const PORT = process.env.PORT || 3000;

// Spotify credentials uit .env
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.send('Server werkt! 🎉');
});

// Debug route - check public folder
app.get('/debug', (req, res) => {
  const publicPath = path.join(__dirname, 'public');
  const indexPath = path.join(publicPath, 'index.html');
  
  res.send(`
    <h2>Debug Info:</h2>
    <p>__dirname: ${__dirname}</p>
    <p>Public path: ${publicPath}</p>
    <p>Public folder exists: ${fs.existsSync(publicPath)}</p>
    <p>index.html exists: ${fs.existsSync(indexPath)}</p>
  `);
});

// Route: Login met Spotify
app.get('/login', (req, res) => {
  const scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';
  const authURL = `https://accounts.spotify.com/authorize?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  
  res.redirect(authURL);
});

// Route: Callback van Spotify
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // Exchange code voor access token
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        },
      }
    );

    const { access_token } = response.data;
    
    // Stuur token naar frontend
    res.redirect(`/?access_token=${access_token}`);
  } catch (error) {
    console.error('Error getting token:', error.response?.data || error.message);
    res.redirect('/?error=token_error');
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server draait op 0.0.0.0:${PORT}`);
  console.log(`🔗 Login via: http://localhost:${PORT}/login`);
});