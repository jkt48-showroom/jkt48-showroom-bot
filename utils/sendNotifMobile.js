const axios = require("axios");
const { google } = require("googleapis");
require("dotenv").config();

// Initialize JWT client for OAuth 2.0
const authClient = new google.auth.JWT({
  email: process.env.FIREBASE_CLIENT_EMAIL,
  key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

// Function to send notification
async function sendNotifMobile(payload) {
  try {
    // Authorize and get an access token
    const tokens = await authClient.authorize();
    const accessToken = tokens.access_token;

    // Send notification using the new FCM v1 API endpoint
    const response = await axios.post(
      `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      { message: payload },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("Notification sent successfully", response.data);
  } catch (error) {
    console.log("Error sending Firebase notification", error.response?.data || error.message);
  }
}

module.exports = sendNotifMobile;
