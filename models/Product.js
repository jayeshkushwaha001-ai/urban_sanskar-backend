const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Product price is required']
    },
    desc: {
        type: String,
        required: [true, 'Product description is required']
    },
    images: {
        type: [String],
        required: [true, 'At least one product image URL is required']
    },
    sizes: {
        type: [String],
        default: ['S', 'M', 'L', 'XL']
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: ['coord-sets', 'dress', 'handloom-dupatta' ,'hand-series', 'stories'],
            message: '{VALUE} is an invalid category'
        }
    },
    collectionTag: {
        type: String,
        default: ""
    },
    fabric: {
        type: String,
        default: "100% Certified Organic Premium Linen"
    },
    fit: {
        type: String,
        default: "Relaxed"
    },
    details: {
        type: String,
        default: "Minimalist Tailoring"
    },
    isBestSeller: {
        type: Boolean,
        default: false
    },
    // 🌟 NEW ADDITION: New Arrivals toggle track karne ke liye
    isNewArrival: {
        type: Boolean,
        default: false
    },
    isSoldOut: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
