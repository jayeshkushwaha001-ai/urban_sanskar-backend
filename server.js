const dns = require('dns');
// Direct Node.js ko bolo ki ISP ka network bypass karke Google/Cloudflare DNS use kare
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 1. Load Environment Variables
dotenv.config();

const app = express();

// 2. Global Middlewares Setup
app.use(cors());
app.use(express.json());

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// Base Test Route
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "Backend Server Is Live! 🚀" });
});

// 3. Database Connection Engine
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔌 MongoDB Connected Successfully to Cloud!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// 4. Base Test Route
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "Backend Server Is Live! 🚀" });
});

// 5. Server Boot Up Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));





