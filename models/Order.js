const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // 1. Checkout Form Data (Customer ki details)
    customerInfo: {
        name: { type: String, required: [true, 'Customer ka naam zaroori hai'] },
        phone: { type: String, required: [true, 'Contact number zaroori hai'] },
        email: { type: String, required: [true, 'Email address zaroori hai'] },
        address: {
            street: { type: String, required: [true, 'Street/Flat details zaroori hai'] },
            city: { type: String, required: [true, 'City zaroori hai'] },
            state: { type: String, required: [true, 'State zaroori hai'] },
            pincode: { type: String, required: [true, 'Pincode zaroori hai'] }
        }
    },

    // 2. Cart Items (Kaun sa product, kitni quantity aur kis size me order hua)
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId, // Yeh Product collection ki unique ID ko connect karega
                ref: 'Product',
                required: true
            },
            title: { type: String, required: true },
            size: { type: String, required: true }, // Jo size customer ne select kiya (S, M, L, XL)
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true } // Ordering ke time par jo price tha
        }
    ],

    // 3. Pricing & Shipping (₹4999 waali business logic store karne ke liye)
    pricing: {
        subTotal: { type: Number, required: true }, // Sirf kapdon ka total price
        shippingCharges: { type: Number, required: true, default: 0 }, // ₹4999 se kam par ₹99, nahi toh 0
        totalAmount: { type: Number, required: true } // subTotal + shippingCharges
    },

    // 4. Razorpay Integration (Payment tracking)
    paymentInfo: {
        razorpayOrderId: { type: String, required: true }, // Razorpay jo order create karte waqt deta hai
        razorpayPaymentId: { type: String, default: '' }, // Payment success hone ke baad jo ID milti hai
        paymentStatus: {
            type: String,
            required: true,
            enum: ['Pending', 'Success', 'Failed'],
            default: 'Pending'
        }
    }
}, {
    timestamps: true // Kab order place hua, uski exact timing track karne ke liye
});

module.exports = mongoose.model('Order', orderSchema);