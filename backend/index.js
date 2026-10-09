const express = require('express');
require('dotenv').config();
const app = express();
const mongoDB= require('./config/db');
const authRoutes = require('./routes/authRoutes')
const port = process.env.PORT || 3000

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api',authRoutes);
//  mongoDB();
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});