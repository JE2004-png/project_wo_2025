import express from "express"
import ejs from "ejs";

const fs = require('fs');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to parse URL-encoded bodies (for filters, etc.)
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/api/directors', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./data/directors.json'));
  res.json(data);
});

app.get('/api/movies', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./data/movies.json'));
  res.json(data);
});

// Index page - overview
app.get('/', (req, res) => {
  const directors = JSON.parse(fs.readFileSync('./data/directors.json'));
  const query = req.query.search || '';
  const sortBy = req.query.sortBy || 'name';
  const sortDir = req.query.dir === 'desc' ? -1 : 1;

  const filtered = directors.filter(() => directors.name.toLowerCase().includes(query));

  filtered.sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return -1 * sortDir;
    if (a[sortBy] > b[sortBy]) return 1 * sortDir;
    return 0;
  });

  res.render('index', { directors: filtered, search: query, sortBy, dir: sortDir });
});

// Detail page for a director
app.get('/director/:id', (req, res) => {
  const directors = JSON.parse(fs.readFileSync('./data/directors.json'));
  const movies = JSON.parse(fs.readFileSync('./data/movies.json'));

  const director = directors.find(d => d.id == req.params.id);
  if (!director) return res.status(404).send('Director not found');

  const relatedMovie = movies.find(m => m.id == director.notableWork.id);

  res.render('directorDetail', { director, relatedMovie });
});

// Detail page for a movie
app.get('/movie/:id', (req, res) => {
  const movies = JSON.parse(fs.readFileSync('./data/movies.json'));
  const movie = movies.find(m => m.id == req.params.id);
  if (!movie) return res.status(404).send('Movie not found');

  res.render('movieDetail', { movie });
});

// Navigation include
app.get('/partials/navbar', (req, res) => {
  res.render('partials/navbar');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));