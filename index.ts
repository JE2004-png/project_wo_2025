import express from "express"
import ejs from "ejs";

const fs = require('fs');
const app = express();
const mongoose = require("mongoose")
const PORT = 3000;4

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/directorsdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const directorSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  age: Number,
  active: Boolean,
  birthdate: String,
  image: String,
  category: String,
  hobbies: [String],
  notableWork: {
    id: Number,
    title: String,
    description: String,
    image: String,
    genre: String,
    year: Number,
    rating: Number,
    active: Boolean
  }
});

const Director = mongoose.model('Director', directorSchema);

async function initializeDatabase() {
  const count = await Director.countDocuments();
  if (count === 0) {
    const response = await fetch('http://localhost:3000/api/directors');
    const directors = await response.json();
    await Director.insertMany(directors);
    console.log('Database initialized with directors');
  }
}

// Init DB on startup
initializeDatabase();

// Routes
app.get('/api/directors', async (req, res) => {
  const directors = await Director.find();
  res.json(directors);
});

app.get('/', async (req, res) => {
  const query = req.query.search || '';
  const sortBy = req.query.sortBy || 'name';
  const sortDir = req.query.dir === 'desc' ? -1 : 1;

  const directors = await Director.find({
    name: { $regex: query, $options: 'i' }
  }).sort({ [sortBy]: sortDir });

  res.render('index', { directors, search: query, sortBy, dir: sortDir });
});

app.get('/director/:id', async (req, res) => {
  const director = await Director.findOne({ id: req.params.id });
  if (!director) return res.status(404).send('Director not found');

  res.render('directorDetail', { director, relatedMovie: director.notableWork });
});

app.get('/movie/:id', async (req, res) => {
  const director = await Director.findOne({ 'notableWork.id': req.params.id });
  if (!director) return res.status(404).send('Movie not found');

  res.render('movieDetail', { movie: director.notableWork });
});

// Edit form for director
app.get('/director/:id/edit', async (req, res) => {
  const director = await Director.findOne({ id: req.params.id });
  if (!director) return res.status(404).send('Director not found');

  res.render('editDirector', { director });
});

app.post('/director/:id/edit', async (req, res) => {
  const { name, age, active, category, description } = req.body;
  await Director.findOneAndUpdate(
    { id: req.params.id },
    {
      name,
      age,
      active: active === 'true',
      category,
      description
    }
  );
  res.redirect(`/director/${req.params.id}`);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
