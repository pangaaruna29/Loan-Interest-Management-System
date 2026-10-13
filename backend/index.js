const express = require('express');
const cors = require('cors')
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const mongoDB= require('./config/db');
const authRoutes = require('./routes/authRoutes')
const port = process.env.PORT || 3000
app.use(cors());
// app.use(cors({
//   origin: [
//     'https://urban-zebra-77vxpw6j6j4ghrxj4-4200.app.github.dev',
//     'http://localhost:4200'
//   ],
//   methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello, World!');
});
app.use('/api',authRoutes);
//  mongoDB();
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});