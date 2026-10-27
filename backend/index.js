const express = require('express');
const cors = require('cors')
const dotenv = require("dotenv");
const path = require('node:path');
dotenv.config({
  path: [
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env')
  ]
});
const app = express();
const mongoDB= require('./config/db');
const authRoutes = require('./routes/authRoutes')
const clientRoutes = require('./routes/clientRoutes')
const port = process.env.PORT || 3000
const allowedOrigins = new Set([
  'https://loan-interest-management-system-8up.vercel.app',
  ...(process.env.FRONTEND_ORIGIN || 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
]);
app.use(express.json());

app.use(cors({
  origin: (origin, callback) => {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api', async (_req, res, next) => {
  try {
    await mongoDB();
    next();
  } catch (_error) {
    res.status(503).json({ message: 'Database unavailable' });
  }
});
app.use('/api',authRoutes);
app.use('/api/clients', clientRoutes);

if (require.main === module) {
  mongoDB().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  });
}

module.exports = app;