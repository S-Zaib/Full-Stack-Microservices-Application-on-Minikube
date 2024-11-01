// backend/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// User Schema for backend service
const UserSchema = new mongoose.Schema({
  userId: String,
  email: String,
  profile: {
    name: String,
    avatar: String,
    preferences: Object
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

mongoose.connect('mongodb://mongodb:27017/backend-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header:', authHeader); // Add this line
  
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided'); // Add this line
      return res.status(401).json({ message: 'Authentication required' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded Token:', decoded); // Add this line
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token Verification Error:', error); // Add this line
      res.status(403).json({ message: 'Invalid token' });
    }
  };

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    console.log("Profile endpoint hit"); // Add this line
    try {
      const user = await User.findOne({ userId: req.user.userId });
      if (!user) {
        console.log("User not found"); // Add this line
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user.profile);
    } catch (error) {
      console.error("Error fetching profile:", error); // Add this line
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  });
  

app.post('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profile = { ...user.profile, ...req.body };
    await user.save();
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Internal route for auth service to create new user records
app.post('/api/users/new', async (req, res) => {
  try {
    const { userId, email } = req.body;
    const user = new User({
      userId,
      email,
      profile: { name: '', avatar: '', preferences: {} }
    });
    await user.save();
    res.status(201).json({ message: 'User profile created' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create user profile' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend service running on port ${PORT}`));