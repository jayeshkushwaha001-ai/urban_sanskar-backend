const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 🚀 ROUTE 1: Naya Product Add Karne Ke Liye (Admin Ke Liye)
router.post('/', async (req, res) => {
    try {
        // 🔥 Naye fields (collectionTag aur isSoldOut) ko destructure kiya
        const {
            title, price, desc, images, sizes, category,
            collectionTag, fabric, fit, details, isBestSeller, isSoldOut
        } = req.body;

        const newProduct = new Product({
            title,
            price,
            desc,
            images,
            sizes,
            category,
            collectionTag,
            fabric,
            fit,
            details,
            isBestSeller,
            isSoldOut // 🔥 Ab naya product banate waqt bhi sold out set kar sakte hain
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            success: true,
            message: "Product added successfully! 🛍️",
            product: savedProduct
        });
    } catch (err) {
        console.error("🔥 Backend Terminal Error:", err);
        res.status(500).json({
            success: false,
            message: "Product add karne me dikkat aayi",
            error: err.message
        });
    }
});

// 🛒 ROUTE 2: Saare Products Get Karne Ke Liye
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Products fetch karne me dikkat aayi",
            error: err.message
        });
    }
});

// 🔥 ROUTE 3: Sirf Best Sellers Get Karne Ke Liye
router.get('/bestsellers', async (req, res) => {
    try {
        const bestSellers = await Product.find({ isBestSeller: true }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: bestSellers.length,
            products: bestSellers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Best sellers fetch karne me dikkat aayi",
            error: err.message
        });
    }
});

// 🔥 ROUTE 4: Kisi Ek Product Ki Detail Nikalne Ke Liye
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product nahi mila!" });
        }
        res.status(200).json({
            success: true,
            product: product
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Product detail fetch karne me dikkat aayi",
            error: err.message
        });
    }
});

// 🔄 ROUTE 5: Product Update Karne Ke Liye (Admin Panel Edit System)
router.put('/:id', async (req, res) => {
    try {
        // Yeh route req.body me jo bhi aayega (tag, isSoldOut, price) sab database me automatic update kar dega
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product nahi mila!" });
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully! 🔄",
            product: updatedProduct
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ❌ ROUTE 6: Product Delete Karne Ke Liye (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product nahi mila!" });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully! 🗑️"
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;