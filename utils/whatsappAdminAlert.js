// utils/whatsappAdminAlert.js
const twilio = require('twilio');

// .env se keys load ho rhi hain
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;

// 🛠️ SAFE INITIALIZATION: Agar keys missing hon toh server crash na ho
let client;
if (accountSid && authToken) {
    try {
        client = twilio(accountSid, authToken);
    } catch (err) {
        console.error("Twilio initialization failed, but server will continue running.");
    }
}

/**
 * Store Owner (Client) ko naye order ka alert bhejna
 * @param {Object} orderData - Database se uthaya hua order payload
 */
async function sendAdminOrderAlert(orderData) {
    // 🚀 ULTRA SHORT-CIRCUIT: Client doesn't want WhatsApp alerts right now.
    // Isko lagane se niche ka koi bhi Twilio API code execute nahi hoga.
    console.log("ℹ️ WhatsApp Admin Notification skipped: Feature disabled by client preference.");
    return { success: true, message: "Notification disabled by choice" };

    // ⬇️ Niche ka saara code bilkul as-is rahega, par kabhi trigger nahi hoga.
    // Jab future mein client kahe ki unhe feature chahiye, bas upar ki do lines hata dena!
    try {
        const info = orderData.customerInfo || {};
        const address = info.address || {};
        const pricing = orderData.pricing || {};
        const items = orderData.orderItems || [];

        const itemsListText = items.map(item => `  • ${item.title} [Size: ${item.size}] x ${item.quantity}`).join('\n');

        const alertMessage = `*🚨 NEW ORDER ALERT - URBAN SANSKAR* \n\n` +
            `Hey pooja, new order confirmation! prepare for Dispatch:\n\n` +
            `👤 *Customer:* ${info.name || 'N/A'}\n` +
            `📞 *Phone:* ${info.phone || 'N/A'}\n` +
            `✉️ *Email:* ${info.email || 'N/A'}\n\n` +
            `*📦 Items To Pack:*\n${itemsListText}\n\n` +
            `*💰 Order Value:*\n` +
            `• Subtotal: ₹${pricing.subTotal}\n` +
            `• Shipping: ₹${pricing.shippingCharges || 0}\n` +
            `• *Total Received: ₹${pricing.totalAmount}* ✅\n\n` +
            `*🏠 Shipping Address:*\n` +
            `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - *${address.pincode || ''}*\n\n` +
            `🆔 *Order Log ID:* ...${orderData._id.toString().substring(12)}\n\n` +
            `Details are live synced on Admin Dashboard! 🚀`;

        if (!client) throw new Error("Twilio client not initialized");

        const res = await client.messages.create({
            body: alertMessage,
            from: 'whatsapp:+14155238886',
            to: `whatsapp:${adminNumber ? adminNumber.trim() : ''}`
        });

        console.log(`📲 WhatsApp Notification Pushed to Admin! SID: ${res.sid}`);
        return { success: true };

    } catch (error) {
        console.error("❌ Failed to push WhatsApp alert to Admin:", error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendAdminOrderAlert };