// server.js

const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your_secret_key';

app.use(cors());
app.use(express.json());

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = await User.create({ username, password: hashedPassword });

    const token = jwt.sign({ id: newUser.id }, SECRET_KEY, { expiresIn: 86400 });
    res.json({ token });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 86400 });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No token provided' });
  }

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to authenticate token' });
    }
    req.userId = decoded.id;
    next();
  });
};

app.post('/download', authenticate, async (req, res) => {
  const { url } = req.body;

  if (!isValidYouTubeUrl(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;

    const videoId = ytdl.getURLVideoID(url);
    const videoPath = path.resolve(__dirname, 'videos', `${videoId}.mp4`);

    const videoStream = ytdl(url, { quality: 'highest' });
    const fileStream = fs.createWriteStream(videoPath);

    let downloadedBytes = 0;
    videoStream.on('progress', (chunkLength, downloaded, total) => {
      downloadedBytes += chunkLength;
      const progress = (downloadedBytes / total) * 100;
      console.log(`Download progress: ${progress.toFixed(2)}%`);
    });

    videoStream.pipe(fileStream);

    fileStream.on('finish', () => {
      res.json({ downloadLink: `http://localhost:${PORT}/videos/${videoId}.mp4` });
    });

    videoStream.on('error', (error) => {
      console.error('Error downloading the video stream', error);
      res.status(500).json({ error: 'Error downloading the video stream' });
    });

    fileStream.on('error', (error) => {
      console.error('Error writing the video file', error);
      res.status(500).json({ error: 'Error writing the video file' });
    });
  } catch (error) {
    console.error('Error downloading the video', error);
    res.status(500).json({ error: 'Error downloading the video' });
  }
});

app.post('/videoInfo', async (req, res) => {
  const { url } = req.body;

  try {
    const videoInfo = await ytdl.getInfo(url);
    const videoTitle = videoInfo.videoDetails.title;
    res.json({ title: videoTitle });
  } catch (error) {
    console.error('Error fetching video info', error);
    res.status(500).json({ error: 'Error fetching video info' });
  }
});

app.use('/videos', express.static(path.resolve(__dirname, 'videos')));

const isValidYouTubeUrl = (url) => {
  const regex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
  return regex.test(url);
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
