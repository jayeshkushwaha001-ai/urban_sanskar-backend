const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username zaroori hai bhai'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email zaroori hai'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password ke bina kaise chalega']
    }
}, { timestamps: true });

// 🔥 UPDATED PASSWORD ENCRYPTION: Pure async/await bina kisi 'next' ke lafde ke
adminSchema.pre('save', async function () {
    if (!this.isModified('password')) return; // Agar password change nahi hua toh ruk jao
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
   
});

// 🔑 PASSWORD CHECKER: Login ke waqt check karne ke liye helper function
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);