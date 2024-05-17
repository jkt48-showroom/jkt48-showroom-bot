const axios = require("axios");
require("dotenv").config();

function sendNotifMobile (payload) {
  axios.post("https://fcm.googleapis.com/fcm/send", payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `key=${process.env.FIREBASE_MESSAGE_KEY}`
    }
  });
}

module.exports = sendNotifMobile;