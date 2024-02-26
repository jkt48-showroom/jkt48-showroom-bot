const express = require('express');
const Discord = require('../controller/discord');
const Schedule = require('../controller/theaterSchedule');
const Bot = require('../controller/messageBot');
const LiveNotif = require('../controller/liveNotif');
const SharingLive = require('../controller/sharingLive');
const router = express.Router();
const middleware = require('../utils/jwtMiddleware');

router.get('/notification', Discord.getLiveNotification)
router.post('/theater-notif', middleware, Schedule.getTheaterNotification)
router.get('/theater-showroom', middleware, Schedule.getTheaterShowroom)
router.post('/message-bot', middleware, Bot.getMessageBot)
router.get('/live-notif-bot', LiveNotif.getLiveNotification)
router.post('/sharing-live', SharingLive.sendNotifDiscord)

module.exports = router;