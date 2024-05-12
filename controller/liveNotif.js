const Discord = require("discord.js");
const axios = require("axios");
const cron = require("node-cron");
const getTimes = require("../utils/getTimes");
const { MongoClient } = require("mongodb");
const {
  bgCyanBright,
  redBright,
  green,
  blueBright,
  red
} = require("colorette");
const IDNLiveNotif = require("./idnLives");
require("dotenv").config();
const moment = require("moment-timezone");

const client = new MongoClient(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define a model for liveIds
const db = client.db("showroom");
const collection = db.collection("live_ids");

// Discord channel for sr-live-notif
const webhookClient = new Discord.WebhookClient({
  id: process.env.LIVE_SHOWROOM_ID,
  token: process.env.LIVE_SHOWROOM_TOKEN
});

async function getTodayTheaterSchedule() {
  try {
    const response = await axios.get(
      `${process.env.SHOWROOM_ADMIN_WEB}/schedules/today`
    );

    return response.data || null; // Return null if no schedule matches today's date
  } catch (error) {
    console.error("Error fetching theater schedules:", error);
    return null;
  }
}

async function sendMobileFirebaseNotif(data) {
  try {
    let name;
    let body;
    let image;

    const todayShow = await getTodayTheaterSchedule();
    const isPremiumLive = data?.premium_room_type === 1;

    if (isPremiumLive) {
      name = "JKT48 Official";
      body = `${name} live show ${todayShow?.setlist?.name} Premium Live!`;
      image = todayShow?.setlist?.image;
    } else {
      name = data.room_url_key.replace("JKT48_", "");
      body = `${name} lagi live showroom nih!`;
      image = data.image?.replace("_s.jpeg", "_l.jpeg");
    }

    const payload = {
      to: "/topics/showroom",
      notification: {
        title: "JKT48 SHOWROOM",
        body: body,
        mutable_content: true,
        sound: "Tri-tone",
        icon: "https://res.cloudinary.com/dkkagbzl4/image/upload/v1715448389/ioc8l1puv69qn7nzc2e9.png",
        image: image
      },
      data: {
        name: name,
        type: "Showroom",
        image: data?.image_square
      }
    };

    axios.post("https://fcm.googleapis.com/fcm/send", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${process.env.FIREBASE_MESSAGE_KEY}`
      }
    });

    return console.log(green(`Sending mobile notif ${name} success`));
  } catch (error) {
    console.log(error);
    console.log(red(`Send mobile notif failed`));
  }
}

// Function to send Discord webhook notification
async function sendWebhookNotification(data, liveTime) {
  try {
    const todayShow = await getTodayTheaterSchedule();
    const isPremiumLive = data?.premium_room_type === 1;

    let name;
    let title;
    let image;

    if (isPremiumLive) {
      name = data.main_name;
      title = `${name} live show theater Premium Live!`;
      image = todayShow?.setlist?.image;
    } else {
      name = data.room_url_key.replace("JKT48_", "") + " JKT48";
      title = `${name} lagi live showroom nih!`;
      image = data.image?.replace("_s.jpeg", "_l.jpeg");
    }

    const link = `${process.env.JKT48_SHOWROOM_WEB}/room/${data.room_url_key}/${data.room_id}?type=live-notif`;

    const description = new Discord.EmbedBuilder()
      .setTitle(title)
      .setURL(link)
      .addFields({
        name: "Live Start:",
        value:
          "⏰ " +
          moment
            .utc(data.liveTime)
            .tz("Asia/Jakarta")
            .locale("id")
            .format("dddd, DD MMMM HH:mm")
      })
      .setImage(image)
      .setColor("#23889a")
      .setTimestamp();

    if (todayShow && isPremiumLive) {
      description.addFields({
        name: "Setlist:",
        value: `${todayShow.setlist.originalName} - ${todayShow.setlist.name} `
      });

      if (todayShow?.isBirthdayShow) {
        description.addFields({
          name: "Birthday:",
          value: `${todayShow.birthdayMember.stage_name}`
        });
      }
    }

    description.addFields(
      {
        name: "Watch on JKT48 Showroom:",
        value: `[Here](${link})`,
        inline: true
      },
      {
        name: "Watch on Showroom:",
        value: `[Here](https://www.showroom-live.com/r/${data.room_url_key})`,
        inline: true
      }
    );

    if (data.party_live_status === 1) {
      description.addFields({
        name: "Collab",
        value: ``
      });
    }

    webhookClient.send({
      username: "JKT48 SHOWROOM BOT",
      avatarURL:
        "https://media.discordapp.net/attachments/1108380195175551047/1134155015242666015/Flag_Fix.png?width=610&height=607",
      embeds: [description]
    });
  } catch (error) {
    console.error("Error sending webhook notification:", error);
  }
}

async function getMemberLiveData() {
  let onLive = [];
  let roomLives = [];

  const response = await axios.get(
    "https://www.showroom-live.com/api/live/onlives"
  );
  const data = response.data.onlives;

  // Find Member Live
  for (let i = 0; i < data.length; i++) {
    const index = data[i];
    if (index.genre_name === "Idol") {
      onLive.push(index);
    }
  }

  // Store member lives data
  if (onLive.length) {
    const roomLive = data[0].lives;
    roomLive.forEach((item) => {
      if (item.room_url_key.includes("JKT48")) {
        roomLives.push(item);
      }
    });
  }

  return roomLives;
}

async function getLiveInfo(rooms) {
  for (const member of rooms) {
    let name;

    const liveTime = member.started_at;
    const liveId = member.live_id;
    const liveDatabase = await collection.find().toArray();
    const liveIds = liveDatabase.map((obj) => obj.live_id);

    name = member.room_url_key.replace("JKT48_", "") + " JKT48";

    if (rooms.length) {
      if (liveIds.includes(liveId)) {
        console.log(
          redBright(`Already notified for ${name} live ID ${liveId}`)
        );
      } else {
        // send notification discord and insert the live id into the database
        sendWebhookNotification(member, liveTime);
        sendMobileFirebaseNotif(member);
        await collection.insertOne({
          roomId: member.room_id ?? member.id,
          name,
          live_id: liveId,
          date: getTimes(liveTime, true)
        });
        console.log(green(`Member ${name} is Live Sending notification...`));
      }
    } else {
      console.log(redBright("No one member lives"));
    }
  }
}

async function sendTodaySchedule() {
  try {
    const todayShow = await getTodayTheaterSchedule();

    if (todayShow) {
      await axios.post(
        `${process.env.DISCORD_BOT_WEB}/discord/message-bot`,
        {
          message: "",
          messageType: "schedule",
          scheduleId: todayShow._id,
          type: "theater"
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MESSAGE_BOT_TOKEN}`
          }
        }
      );
    }
  } catch (error) {
    console.log("error sending today theater", error);
  }
}

function getScheduledJobTime() {
  let now = new Date();
  let options = {
    timeZone: "Asia/Jakarta",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  };
  let formattedDate = now.toLocaleString("id-ID", options);

  return console.log(bgCyanBright(`Live Job Running at ${formattedDate}`));
}

let cronJob;

const DiscordApi = {
  getLiveNotification: async (req, res) => {
    try {
      // Clear previous cron job if it exists
      if (cronJob) {
        cronJob?.destroy();
      }
      const roomLives = await getMemberLiveData();
      sendMobileFirebaseNotif({
        room_url_key: "officialJKT48",
        official_lv: 1,
        follower_num: 509613,
        started_at: 1715514419,
        live_id: 19631832,
        is_follow: false,
        streaming_url_list: [],
        live_type: 3,
        tags: [],
        image:
          "https://static.showroom-live.com/image/room/cover/73f495d564945090f4af7338a42ce09ffa12d35fbfa8ce35c856220bcf96c5f3_s.png?v=1715261567",
        view_num: 111,
        genre_id: 102,
        main_name: "JKT48 Official SHOWROOM",
        liver_theme_title: "",
        premium_room_type: 1,
        cell_type: 100,
        bcsvr_key: "12b8ed8:AEup8ZbE",
        room_id: 332503
      });
      // Set up new cron job
      cronJob = cron.schedule("*/1 * * * *", async () => {
        const roomLives = await getMemberLiveData();
        await getLiveInfo(roomLives);
        await IDNLiveNotif.sendDiscordNotif();
        getScheduledJobTime();

        // send today schedule
        const now = new Date();
        if (now.getHours() === 12 && now.getMinutes() === 30) {
          await sendTodaySchedule();
          console.log(blueBright("Today schedule sent to discord"));
        }
      });

      if (roomLives?.length > 0) {
        const roomNameData = roomLives.map((member) => member.main_name);

        res.send({
          message: "Live notification sent!",
          data: roomNameData
        });
      } else {
        res.send({
          message: "No one member lives"
        });
        console.log(redBright("No one member lives"));
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  }
};

module.exports = DiscordApi;
