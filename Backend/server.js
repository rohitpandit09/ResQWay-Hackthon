const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/authRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const { connectDB } = require('./src/config/db');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

app.use(cors());
app.use(cookieParser());
app.use(express.json());

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {

  res.status(200).json({
    message: 'Welcome to the ResQWay API',
    status: 'ok'
  });
  
});

app.use('/api/auth', authRoutes);
app.use('/api/location', locationRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  connectDB();
});