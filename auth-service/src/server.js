// auth-service/src/server.js
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Auth User Schema
const AuthSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date
});

const Auth = mongoose.model('Auth', AuthSchema);

mongoose.connect('mongodb://mongodb:27017/auth-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Authentication Routes
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user._id });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.toString() });
    }
  }
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await Auth.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new Auth({
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.toString() });
    }
  }
});

app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Auth.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user instead of creating a reset token
    await Auth.deleteOne({ email });

    // Send response indicating the account has been deleted
    res.json({ 
      message: 'Account has been deleted. You can now sign up again with the same email address.',
      status: 'deleted'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.toString() });
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Auth service running on port ${PORT}`));