// backend/src/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// We'll use the Auth model directly instead of creating a separate User model
const AuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    name: String,
    avatar: String,
    preferences: Object
  },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: { type: Date, default: Date.now }
});

const Auth = mongoose.model('Auth', AuthSchema);

mongoose.connect('mongodb://mongodb:27017/auth-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization Header:', authHeader);

  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token Verification Error:', error);
    res.status(403).json({ message: 'Invalid token' });
  }
};

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  console.log("Profile endpoint hit");
  try {
    const user = await Auth.findOne({ _id: req.user.userId });
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: 'User not found' });
    }
    // Include email in the response
    res.json({
      email: user.email,
      profile: user.profile || {},
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.post('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const user = await Auth.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.profile = { ...user.profile, ...req.body };
    await user.save();
    res.json({
      email: user.email,
      profile: user.profile,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend service running on port ${PORT}`));