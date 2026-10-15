const express = require('express');
const cors = require('cors')
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const mongoDB= require('./config/db');
const authRoutes = require('./routes/authRoutes')
const port = process.env.PORT || 3000
app.use(express.json());

mongoDB();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api',authRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});