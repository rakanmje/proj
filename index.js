require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const { Event, Favorite, Booking } = require('./models/Event');

const app = express();

// Middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema
const User = mongoose.model('User', new mongoose.Schema({
  email: String,
  password: String,
  userType: { type: String, enum: ['attendee', 'organizer'], required: true },
  name: String,
  bio: String,
  profilePic: String,
  companyName: String,
  companyLogo: String,
  companyDescription: String,
  registeredAt: { type: Date, default: Date.now }
}));

// Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// === Authentication ===
app.post('/api/register', async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashed });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password, userType } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.userType !== userType) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' });

    req.session.userId = user._id;
    req.session.userType = user.userType;
    res.json({ success: true, userId: user._id, userType: user.userType });
  } catch {
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// === Events ===
app.post('/api/events', upload.single('image'), async (req, res) => {
  const organizerId = req.session.userId;
  if (!organizerId || req.session.userType !== 'organizer') return res.status(403).json({ error: 'Not authorized' });

  try {
    const { name, location, date, seats, description, category, price } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '/uploads/default-event.png';
    const event = new Event({ name, location, date, seats, description, category, price, image, organizerId });
    await event.save();
    res.status(201).json(event);
  } catch {
    res.status(500).json({ error: 'Event creation failed' });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch {
    res.status(500).json({ error: 'Failed to fetch event data' });
  }
});

app.put('/api/events/:id', upload.single('image'), async (req, res) => {
  try {
    const update = {
      name: req.body.name,
      location: req.body.location,
      date: new Date(req.body.date),
      seats: parseInt(req.body.seats),
      description: req.body.description,
      category: req.body.category,
      price: parseFloat(req.body.price)
    };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(event);
  } catch {
    res.status(500).json({ error: 'Event update failed' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.get('/api/organizer/events', async (req, res) => {
  const userId = req.query.userId;
  try {
    const events = await Event.find({ organizerId: userId });
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// ✅ Public Events with Favorites
app.get('/api/events', async (req, res) => {
  const userId = req.query.userId;
  try {
    let favorites = [];
    let bookings = [];

    if (userId) {
      const favs = await Favorite.find({ userId }).select('eventId');
      favorites = favs.map(f => f.eventId.toString());

      const booked = await Booking.find({ userId }).select('eventId');
      bookings = booked.map(b => b.eventId.toString());
    }

    const events = await Event.find({}).lean();
    const result = events.map(e => ({
      ...e,
      isFavorite: favorites.includes(e._id.toString()),
      isBooked: bookings.includes(e._id.toString())
    }));

    result.sort((a, b) => b.isFavorite - a.isFavorite);
    res.json(result);
  } catch (err) {
    console.error('Error loading events:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// === Organizer Company Info Update ===
app.post('/api/organizer/company/:id', upload.single('companyLogo'), async (req, res) => {
  try {
    const update = {
      companyName: req.body.companyName,
      companyDescription: req.body.companyDescription
    };
    if (req.file) update.companyLogo = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// === Favorites ===
app.post('/api/favorite', async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.userType !== 'attendee') return res.status(403).json({ error: 'Only attendees can favorite' });
    const existing = await Favorite.findOne({ userId, eventId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return res.json({ favorited: false });
    } else {
      await new Favorite({ userId, eventId }).save();
      return res.json({ favorited: true });
    }
  } catch {
    res.status(500).json({ error: 'Favorite toggle failed' });
  }
});

// === Booking (Toggle) ===
app.post('/api/book', async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.userType !== 'attendee') return res.status(403).json({ error: 'Only attendees can book' });

    const existing = await Booking.findOne({ userId, eventId });
    if (existing) {
      await Booking.deleteOne({ _id: existing._id });
      return res.json({ booked: false, message: 'Booking canceled' });
    } else {
      await new Booking({ userId, eventId, seatsBooked: 1 }).save();
      return res.json({ booked: true, message: 'Booking successful' });
    }
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking toggle failed' });
  }
});

// === User Profile ===
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    const bookings = await Booking.find({ userId: user._id }).populate('eventId');
    const favorites = await Favorite.find({ userId: user._id }).populate('eventId');

    const upcoming = bookings.filter(b => b.eventId && new Date(b.eventId.date) >= now).map(b => b.eventId);
    const past = bookings.filter(b => b.eventId && new Date(b.eventId.date) < now).map(b => b.eventId);
    const saved = favorites.map(f => f.eventId);

    res.json({
      name: user.name || user.email.split('@')[0],
      bio: user.bio || '',
      email: user.email,
      profilePic: user.profilePic,
      companyName: user.companyName || '',
      companyLogo: user.companyLogo || '',
      companyDescription: user.companyDescription || '',
      registeredAt: user.registeredAt,
      upcoming,
      past,
      saved
    });
  } catch {
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

app.post('/api/user/:id/update', async (req, res) => {
  try {
    const { name, bio } = req.body;
    await User.findByIdAndUpdate(req.params.id, { name, bio });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post('/api/user/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const photoPath = '/uploads/' + req.file.filename;
    await User.findByIdAndUpdate(req.params.id, { profilePic: photoPath });
    res.json({ success: true, photo: photoPath });
  } catch {
    res.status(500).json({ success: false });
  }
});

// Start Server
app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT || 3000}`);
});
