const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Request ke Header se token nikalna
    const token = req.header('Authorization')?.split(' ')[1]; // Expecting: "Bearer <token>"

    // 2. Agar token nahi hai toh access denied
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token, authorization denied!' });
    }

    try {
        // 3. Token ko verify karna (JWT_SECRET aapke .env file me hona chahiye)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'URBAN_SANSKAR_SECRET_KEY');
        
        // 4. Request object me admin ka data daal dena
        req.admin = decoded.adminId;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token valid nahi hai bhai!' });
    }
};