const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); // Admin Model
const Order = require('../models/Order'); // Order Model
const auth = require('../middleware/auth'); // Security Guard Middleware

const JWT_SECRET = process.env.JWT_SECRET || 'URBAN_SANSKAR_SECRET_KEY';

// ==========================================
// 1. ADMIN REGISTRATION ROUTE (Sign Up)
// Endpoint: POST /api/admin/register
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check karo ki admin pehle se toh nahi bana hua
        let adminExists = await Admin.findOne({ $or: [{ email }, { username }] });
        if (adminExists) {
            return res.status(400).json({ success: false, message: "Admin account pehle se maujood hai bhai!" });
        }

        // Naya Admin create karo (password Schema ke .pre trigger se automatically hash ho jayega)
        const newAdmin = new Admin({ username, email, password });
        await newAdmin.save();

        res.status(201).json({ success: true, message: "Admin account successfully created! 🔑" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 2. ADMIN LOGIN ROUTE (Token Generator)
// Endpoint: POST /api/admin/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Email se Admin ko dhoondo
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ success: false, message: "Galat email ya password!" });
        }

        // Password check karo (Model ka comparePassword function call hoga)
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Galat email ya password!" });
        }

        // JWT Token banao jo agle 24 ghante tak valid rahega
        const token = jwt.sign(
            { adminId: admin._id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: "Welcome back, Admin! 🚀",
            token: `Bearer ${token}` // Token frontend ko bhej diya
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 3. STATS FETCH (PROTECTED 🛡️)
// Endpoint: GET /api/admin/stats
// ==========================================
router.get('/stats', auth, async (req, res) => { // 🔥 Added 'auth' middleware
    try {
        const orders = await Order.find();
        console.log(`🔥 Protected: Total ${orders.length} orders fetched for stats.`);

        const totalOrders = orders.length;

        const paidOrders = orders.filter(order => {
            const status = order.paymentStatus || (order.paymentInfo && order.paymentInfo.paymentStatus);
            return status === 'Success' || status === 'Paid';
        });

        const totalSales = paidOrders.reduce((sum, order) => {
            const amount = order.totalAmount || (order.pricing && order.pricing.totalAmount) || 0;
            return sum + amount;
        }, 0);

        res.json({ success: true, totalOrders, totalSales });
    } catch (err) {
        console.error("🔥 Stats calculation error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 4. ORDERS FETCH (PROTECTED 🛡️)
// Endpoint: GET /api/admin/orders
// ==========================================
router.get('/orders', auth, async (req, res) => { // 🔥 Added 'auth' middleware
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: "Order fetch failed" });
    }
});

module.exports = router;