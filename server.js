const dns = require('dns');
// ⚠️ TIP: Agar Render par MongoDB connect na ho, toh niche waali dono lines ko comment out (//) kar dena.
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

// 🚀 3. LIGHT-WEIGHT HEALTH ROUTE (UptimeRobot ke liye sabse pehle)
// Isse server par zero load padega aur automatic pings bina kisi error ke pass ho jayenge
app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

// 🚀 4. BASE TEST ROUTE (Sirf manual checking ke liye)
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: "Backend Server Is Live! 🚀" });
});

// 5. API Routes Setup
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 6. Database Connection Engine
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
    .then(() => console.log('🔌 MongoDB Connected Successfully to Cloud!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err.message));

// 7. Server Boot Up Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
