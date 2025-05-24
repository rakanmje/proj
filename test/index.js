require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// MongoDB Connection
const dbUri = process.env.MONGODB_URI;
if (!dbUri || (!dbUri.startsWith('mongodb://') && !dbUri.startsWith('mongodb+srv://'))) {
  console.error('❌ Invalid MongoDB URI');
  process.exit(1);
}
mongoose.connect(dbUri).then(() => console.log('✅ Connected to MongoDB')).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Schemas
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  userType: { type: String, enum: ['attendee', 'organizer'], required: true },
  companyName: String,
  companyLicense: String,
  companyLocation: String,
  companyDescription: String
});
const User = mongoose.model('User', userSchema);

const eventSchema = new mongoose.Schema({
  name: String,
  location: String,
  date: Date,
  seats: Number,
  description: String,
  price: Number,
  category: String,
  image: String,
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Event = mongoose.model('Event', eventSchema);

const Favorite = mongoose.model('Favorite', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }
}));

const Booking = mongoose.model('Booking', new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  seatsBooked: { type: Number, default: 1 }
}));

// Routes

// Register
app.post('/api/register', async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({ ...req.body, password: hashed });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password, userType } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.userType !== userType) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Incorrect password' });

    req.session.userId = user._id;
    req.session.userType = user.userType;
    res.json({ success: true, userId: user._id, userType: user.userType });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Create Event (Organizer only)
app.post('/api/events', async (req, res) => {
  const organizerId = req.session.userId;
  if (!organizerId || req.session.userType !== 'organizer') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  try {
    const event = new Event({ ...req.body, date: new Date(req.body.date), seats: parseInt(req.body.seats), organizerId });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Event creation failed' });
  }
});

// Get All Events (sorted by user favorites if attendee)
app.get('/api/events', async (req, res) => {
  const userId = req.query.userId;
  try {
    let favorites = [];
    if (userId) {
      const favs = await Favorite.find({ userId }).select('eventId -_id');
      favorites = favs.map(f => f.eventId.toString());
    }
    const events = await Event.find({}).lean();
    const eventsWithFav = events.map(e => ({
      ...e,
      isFavorite: favorites.includes(e._id.toString())
    }));
    eventsWithFav.sort((a, b) => b.isFavorite - a.isFavorite);
    res.json(eventsWithFav);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ error: 'Failed to load events' });
  }
});

// Favorite Event (Attendee only)
app.post('/api/favorite', async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.userType !== 'attendee') {
      return res.status(403).json({ error: 'Only attendees can favorite' });
    }
    const existing = await Favorite.findOne({ userId, eventId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      res.json({ favorited: false });
    } else {
      await new Favorite({ userId, eventId }).save();
      res.json({ favorited: true });
    }
  } catch (err) {
    console.error('Favorite error:', err);
    res.status(500).json({ error: 'Toggle favorite failed' });
  }
});

// Book Event (Attendee only)
app.post('/api/book', async (req, res) => {
  const { userId, eventId, seatsBooked } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || user.userType !== 'attendee') {
      return res.status(403).json({ error: 'Only attendees can book' });
    }
    await new Booking({ userId, eventId, seatsBooked }).save();
    res.status(201).json({ message: 'Booking successful' });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT || 3000}`);
});
