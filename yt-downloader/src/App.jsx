// App.jsx

import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

  const handleAuth = async (isRegister) => {
    const endpoint = isRegister ? 'register' : 'login';
    try {
      const response = await axios.post(`http://localhost:5000/${endpoint}`, { username, password });
      setToken(response.data.token);
      setIsLoggedIn(true);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
      console.error('Auth error', error);
    }
  };

  const handleDownload = async () => {
    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setLoading(true);
    setError('');
    setProgress(0);
    setDownloadLink('');

    try {
      const response = await axios.post(
        'http://localhost:5000/download',
        { url },
        {
          headers: { Authorization: `Bearer ${token}` },
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      setDownloadLink(response.data.downloadLink);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
      console.error('Error downloading the video', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoTitle = async () => {
    try {
      const response = await axios.post('http://localhost:5000/videoInfo', { url });
      setVideoTitle(response.data.title);
    } catch (error) {
      setError(error.response?.data?.error || 'An error occurred');
      console.error('Error fetching video title', error);
    }
  };

  const isValidYouTubeUrl = (url) => {
    const regex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>YouTube Video Downloader</h1>
        {!isLoggedIn ? (
          <div className="auth-container">
            <h2>{isRegistering ? 'Register' : 'Login'}</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button onClick={() => handleAuth(isRegistering)}>
              {isRegistering ? 'Register' : 'Login'}
            </button>
            <button className="switch-button" onClick={() => setIsRegistering(!isRegistering)}>
              {isRegistering ? 'Switch to Login' : 'Switch to Register'}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        ) : (
          <div className="download-container">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={fetchVideoTitle}
              placeholder="Enter YouTube URL"
            />
            {videoTitle && <p className="video-title">Title: {videoTitle}</p>}
            <button onClick={handleDownload} disabled={loading}>
              {loading ? 'Downloading...' : 'Download'}
            </button>
            {loading && (
              <div className="progress-container">
                <p>Download progress:</p>
                <progress value={progress} max="100">
                  {progress}%
                </progress>
              </div>
            )}
            {error && <p className="error">{error}</p>}
            {downloadLink && (
              <div>
                <a href={downloadLink} download>
                  Click here to download the video
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
