const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../models/Order');

// 🔥 STEP 1: WhatsApp Admin Alert Utility ko import kiya
const { sendAdminOrderAlert } = require('../utils/whatsappAdminAlert');

// 🔑 Razorpay Instance Initialize Karo
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 🚀 ROUTE: Create Order & Initialize Razorpay Payment
// routes/orderRoutes.js ke andar /checkout route ko isse replace karo:
router.post('/checkout', async (req, res) => {
    try {
        const { customerInfo, orderItems } = req.body;
        const Product = require('../models/Product'); // Product model ko loop ke liye bulaya

        let subTotal = 0;

        // 🔥 CRITICAL INVENTORY GUARD SHIELD 🔥
        // Loop chalao aur har ek item ko live database me check karo
        for (let item of orderItems) {
            const liveProduct = await Product.findById(item.product);

            if (!liveProduct) {
                return res.status(404).json({
                    success: false,
                    message: `Product "${item.title}" NOT FOUND!`
                });
            }

            // 🚫 AGAR MAAL KHATAM HAI TOH RAASTA YAHIN BLOCK KARDO
            if (liveProduct.isSoldOut) {
                return res.status(400).json({
                    success: false,
                    message: `⚠️ OOPS! "${item.title}" HAS BEEN SOLD OUT. KINDLY, REMOVE IT FROM CART.`
                });
            }

            subTotal += item.price * item.quantity;
        }

        // Baaki ka tumhara purana pricing rule ekdum sahi hai...
        let shippingCharges = subTotal < 4999 ? 99 : 0;
        let totalAmount = subTotal + shippingCharges;

        const options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);

        const newOrder = new Order({
            customerInfo,
            orderItems,
            pricing: { subTotal, shippingCharges, totalAmount },
            paymentInfo: {
                razorpayOrderId: razorpayOrder.id,
                paymentStatus: 'Pending'
            }
        });

        const savedOrder = await newOrder.save();

        res.status(201).json({
            success: true,
            message: "Razorpay Order Created Successfully! 💳",
            razorpayOrderId: razorpayOrder.id,
            totalAmount: totalAmount,
            keyId: process.env.RAZORPAY_KEY_ID,
            dbOrderId: savedOrder._id
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Checkout process me dikkat aayi",
            error: err.message
        });
    }
});

// 🔐 ROUTE: Payment Verify Karne Ke Liye (Jab customer pay kar de)
router.post('/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        const isAuthentic = expectedSign === razorpay_signature;

        if (isAuthentic) {
            // DB Me Status 'Success' Karo
            const updatedOrder = await Order.findOneAndUpdate(
                { "paymentInfo.razorpayOrderId": razorpay_order_id },
                {
                    $set: {
                        "paymentInfo.razorpayPaymentId": razorpay_payment_id,
                        "paymentInfo.paymentStatus": "Success"
                    }
                },
                { new: true }
            );

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: "Order database me nahi mila" });
            }

            // 🔥 STEP 2: MAGIC LINE - Background me Client ko WhatsApp alert bhej do!
            sendAdminOrderAlert(updatedOrder);

            res.status(200).json({
                success: true,
                message: "Payment Verified & Order Placed Successfully! 🛍️✨",
                order: updatedOrder
            });

        } else {
            res.status(400).json({
                success: false,
                message: "Payment verification failed! Invalid Signature ❌"
            });
        }

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Verification process me dikkat aayi",
            error: err.message
        });
    }
});

// 🌐 ROUTE: Razorpay Webhook (Server-to-Server Backup Safety)
router.post('/webhook', async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // 1. Razorpay Ka Signature Verify Karo (Security Check)
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== req.headers['x-razorpay-signature']) {
            console.error('❌ Fake Webhook Request Detected!');
            return res.status(400).json({ status: 'failed', message: 'Invalid signature' });
        }

        // Signature valid hai! Ab event check karo
        const event = req.body.event;

        // 2. Agar Payment Capture Ho Gayi Hai (Chahe frontend crash ho gaya ho)
        if (event === 'payment.captured' || event === 'order.paid') {
            const paymentEntity = req.body.payload.payment.entity;
            const rzpOrderId = paymentEntity.order_id;    
            const rzpPaymentId = paymentEntity.id;        

            // Check karo agar `/verify` ne pehle hi isko Success na kar diya ho
            const existingOrder = await Order.findOne({ "paymentInfo.razorpayOrderId": rzpOrderId });
            
            if (existingOrder && existingOrder.paymentInfo.paymentStatus !== 'Success') {
                // DB Me Status 'Success' Karo
                existingOrder.paymentInfo.razorpayPaymentId = rzpPaymentId;
                existingOrder.paymentInfo.paymentStatus = 'Success';
                
                const savedOrder = await existingOrder.save();
                
                // 🔥 WhatsApp alert backup me yahan se bhi chala jayega!
                sendAdminOrderAlert(savedOrder);
                console.log(`✅ Order ${savedOrder._id} Secured via Webhook!`);
            }
        }

        // Razorpay ko batao ki request mil gayi hai
        res.status(200).json({ status: 'ok' });

    } catch (err) {
        console.error('🚨 Webhook Error:', err.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
