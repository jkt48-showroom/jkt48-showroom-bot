const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const cron = require("node-cron");
const API = "https://jkt48-showroom-api.vercel.app/api";
const getTimes = require("../utils/getTimes");
const { MongoClient } = require("mongodb");
const { bgCyanBright, redBright, green } = require("colorette");
require("dotenv").config();

const uri = process.env.MONGO_DB;
const client = new MongoClient(uri, { useUnifiedTopology: true });

// Define a model for liveIds
const db = client.db("showroom");
const collection = db.collection("live_ids");

// Discord channel for live-notification
const webhookClient = new Discord.WebhookClient({
  id: process.env.ID,
  token: process.env.TOKEN,
});

// Discord channel for live-notification
const webhookClientTheater = new Discord.WebhookClient({
  id: process.env.ID_THEATER_CHANNEL,
  token: process.env.TOKEN_THEATER_CHANNEL,
});


// Function to send Discord webhook notification
function sendWebhookNotification(liveInfo, liveTime, type = "live") {
  const name = liveInfo.url_key
    ? liveInfo.url_key.replace("JKT48_", "") + " JKT48"
    : liveInfo.room_url_key.replace("JKT48_", "") + " JKT48";
  const link = `https://jkt48-showroom.vercel.app/room/${liveInfo.url_key ?? liveInfo.room_url_key
    }/${liveInfo.id ?? liveInfo.room_id}`;

  const description = new Discord.EmbedBuilder()
    .setTitle(
      (type === "live"
        ? `${name} is now LIVE on SHOWROOM!`
        : `${name} mau live nih!`)
    )
    .setURL(link)
    .addFields(
      {
        name: "Live started:",
        value: (type === "live" ? getTimes(liveTime) : getTimes(liveTime, true)),
      },
      {
        name: "Watch on JKT48 Showroom:",
        value: `[Here](${link})`,
        inline: true,
      },
      {
        name: "Watch on Showroom:",
        value: `[Here](https://www.showroom-live.com/r/${liveInfo.url_key ?? liveInfo.room_url_key
          })`,
        inline: true,
      }
    )
    .setDescription(`Silahkan Pilih Link Streaming`)
    .setImage(liveInfo.image_url?.replace("_m.jpeg", "_l.jpeg") ?? liveInfo.image?.replace("_m.jpeg", "_l.jpeg"))
    .setColor("#23889a");

  webhookClient.send({
    username: "JKT48 SHOWROOM BOT",
    avatarURL: "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    embeds: [description],
  });
}

async function getLiveInfo(roomType, url) {
  const response = await axios.get(url);
  const rooms = response.data;

  for (const member of rooms) {
    let name;

    const roomUrl = `${API}/rooms/profile/${member.room_id ?? member.id
      }/asdasd`;
    const profile = await axios.get(roomUrl);
    const liveTime = profile.data.current_live_started_at;
    const liveId = profile.data.live_id;
    const liveUpcomingId = profile.data.next_live_schedule;
    const liveDatabase = await collection.find().toArray();
    const liveIds = liveDatabase.map((obj) => obj.live_id);

    if (roomType === "regular") {
      name = member.url_key.replace("JKT48_", "") + " JKT48";

      if (member.is_live) {
        if (liveIds.includes(liveId)) {
          console.log(
            redBright(`Already notified for ${name} live ID ${liveId}`)
          );
        } else {
          // send notification discord and insert the live id into the database
          await sendWebhookNotification(member, liveTime);
          await collection.insertOne({
            roomId: member.room_id ?? member.id,
            name,
            live_id: liveId,
            date: getTimes(liveTime, true),
          });
          console.log(green(`Member ${name} is Live Sending notification...`));
        }
      } else {
        console.log(`${name} not live`);
      }

    } else {
      name = member.room_url_key.replace("JKT48_", "") + " JKT48";

      if (member.is_onlive) {
        if (liveIds.includes(liveId)) {
          console.log(
            redBright(`Already notified for ${name} live ID ${liveId}`)
          );
        } else {
          // send notification discord and insert the live id into the database
          await sendWebhookNotification(member, liveTime);
          await collection.insertOne({
            roomId: member.room_id ?? member.id,
            name,
            live_id: liveId,
            date: getTimes(liveTime, true),
          });
          console.log(green(`Member ${name} is Live Sending notification...`));
        }
      } else {
        console.log(`${name} not LIVE`);
      }
    }
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
    second: "numeric",
  };
  let formattedDate = now.toLocaleString("id-ID", options);

  return console.log(bgCyanBright(`Live Job Running at ${formattedDate}`));
}


async function getNotifTheaterSchedule() {
  const response = await axios.get(`https://showroom-admin.ikhbaldwiyan.repl.co/schedules`);
  const theaterSchedule = response.data;

  const embed = new Discord.EmbedBuilder()
    .setTitle("Jadwal Theater Premium Live Showroom ")
    .setColor("#23889a")
    .setImage(
      "https://static.showroom-live.com/image/room/cover/73f495d564945090f4af7338a42ce09ffa12d35fbfa8ce35c856220bcf96c5f3_m.png?v=1683304746"
    )
    .addFields({ name: " ", value: " ------------------- " })
    .setURL("https://jkt48-showroom.vercel.app/theater-schedule")
    .setThumbnail(
      "https://assets.ayobandung.com/crop/0x0:0x0/750x500/webp/photo/2023/02/02/2927366731.jpeg"
    )
    .setTimestamp();

  theaterSchedule.forEach((schedule) => {
    embed.addFields(
      { name: `${schedule.setlist}`, value: " " },
      { name: "Date :", value: moment(schedule.showDate).format("DD MMM"), inline: true },
      { name: "Time :", value: schedule.showTime + " WIB", inline: true },
      { name: "Member", value: schedule.memberList.map(member => member.stage_name).join(', ') },
      { name: " ", value: " -------------------- " }
    );
  });

  webhookClientTheater.send({
    username: "JKT48 SHOWROOM BOT",
    avatarURL: "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    embeds: [embed],
  });
}

function recapOneWeekLiveData() {
  const response = axios.get(
    `https://dc.crstlnz.site/api/showroom/recent?sort=date&page=1&filter=active&order=-1&perpage=18`
  );
  const recents = response.data.recents;

  // Get the date 1 week ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Filter the array based on events from the past week
  const filteredArray = recents.filter((item) => {
    const startDate = new Date(item.live_info.date.start);
    return startDate >= oneWeekAgo;
  });

  // Create a message embed for the recap
  const embed = new MessageEmbed()
    .setTitle('Recap of Live Events from the Past Week')
    .setColor('#0099ff');

  // Add each event from the filtered array to the embed
  filteredArray.forEach((item) => {
    embed.addField(item.title, `Start Date: ${item.live_info.date.start}`);
  });

  webhookClient.send({
    username: 'JKT48 SHOWROOM BOT',
    avatarURL: 'https://image.showroom-cdn.com/showroom-prod/image/avatar/1028686.png?v=87',
    embeds: [embed],
  })
    .then(() => {
      console.log('Recap message sent successfully!');
    })
    .catch((error) => {
      console.log('Error sending recap message:', error);
    });
}


let cronJob;

const DiscordApi = {
  getLiveNotification: async (req, res) => {

    try {
      // Clear previous cron job if it exists
      if (cronJob) {
        cronJob?.destroy();
      }

      cronJob = cron.schedule('0 20 * * 0', async () => {
        // getNotifTheaterSchedule();
      });

      await getLiveInfo("regular", `${API}/rooms`);
      await getLiveInfo("academy", `${API}/rooms/academy`);
      await getLiveInfo("trainee", `${API}/rooms/trainee`);
      getScheduledJobTime();


      // Set up new cron job
      cronJob = cron.schedule("*/5 * * * *", async () => {
        await getLiveInfo("regular", `${API}/rooms`);
        await getLiveInfo("academy", `${API}/rooms/academy`);
        await getLiveInfo("trainee", `${API}/rooms/trainee`);
        getScheduledJobTime();
      });
      //
      res.send("Live notification sent!");
    } catch (error) {
      console.log(error)
      res.status(500).send("Error sending live notification");
    }
  },
};

module.exports = DiscordApi;
