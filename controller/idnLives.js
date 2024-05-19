const axios = require("axios");
const { MongoClient } = require("mongodb");
const { bgCyanBright, redBright, green, red } = require("colorette");
const Discord = require("discord.js");
const moment = require('moment-timezone');
const sendNotifMobile = require("../utils/sendNotifMobile");
require("dotenv").config();

let idnUsernames = [
  "jkt48_freya",
  "jkt48_ashel",
  "jkt48_amanda",
  "jkt48_gita",
  "jkt48_lulu",
  "jkt48_jessi",
  "jkt48_shani",
  "jkt48_raisha",
  "jkt48_muthe",
  "jkt48_chika",
  "jkt48_christy",
  "jkt48_lia",
  "jkt48_cathy",
  "jkt48_cynthia",
  "jkt48_daisy",
  "jkt48_indira",
  "jkt48_eli",
  "jkt48_michie",
  "jkt48_gracia",
  "jkt48_ella",
  "jkt48_adel",
  "jkt48_feni",
  "jkt48_marsha",
  "jkt48_zee",
  "jkt48_lyn",
  "jkt48_indah",
  "jkt48_elin",
  "jkt48_chelsea",
  "jkt48_danella",
  "jkt48_gendis",
  "jkt48_gracie",
  "jkt48_greesel",
  "jkt48_flora",
  "jkt48_olla",
  "jkt48_kathrina",
  "jkt48_oniel",
  "jkt48_fiony",
  "jkt48_callie",
  "jkt48_alya",
  "jkt48_anindya",
  "jkt48_jeane",
  "jkt48-official",
  "jkt48_aralie",
  "jkt48_delynn",
  "jkt48_shasa",
  "jkt48_lana",
  "jkt48_erine",
  "jkt48_fritzy",
  "jkt48_lily",
  "jkt48_trisha",
  "jkt48_moreen",
  "jkt48_levi",
  "jkt48_nayla",
  "jkt48_nachia",
  "jkt48_oline",
  "jkt48_regie",
  "jkt48_ribka",
  "jkt48_nala",
  "jkt48_kimmy",
];

const client = new MongoClient(process.env.MONGO_DB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// Define a model for liveIds
const db = client.db("showroom");
const collection = db.collection("idn_lives_history");

// Discord channel for idn-live-notif
const webhookClient = new Discord.WebhookClient({
  id: process.env.IDN_LIVE_NOTIF_CHANNEL_ID,
  token: process.env.IDN_LIVE_NOTIF_CHANNEL_TOKEN,
});

async function sendMobileFirebaseNotif(data) {
  try {
    const memberName = data.user.name;

    const payload = {
      to: "/topics/showroom",
      notification: {
        title: `IDN Live: ${data.title}`,
        body: `${memberName} lagi IDN Live nih`,
        mutable_content: true,
        sound: "Tri-tone",
        icon: "https://res.cloudinary.com/dkkagbzl4/image/upload/v1715448389/ioc8l1puv69qn7nzc2e9.png",
        image: data.image
      },
      data: {
        name: memberName,
        type: "IDN",
        profile: data,
        screen: "IDNStream"
      }
    };

    sendNotifMobile(payload)

    return console.log(green(`Sending mobile IDN notif ${memberName} success`)); 
  } catch (error) {
    console.log(error)
    console.log(red(`Send mobile IDN notif failed`))
  }
}

// Function to send Discord webhook notification
async function sendWebhookNotification(data) {
  try {
    const link = `https://www.jkt48showroom.com/idn/${data.user.username}?type=live-notif`;

    const description = new Discord.EmbedBuilder()
      .setTitle(`${data.user.name} lagi IDN Live nih`)
      .setURL(link)
      .setImage(data.image)
      .setColor("#23889a")
      .setTimestamp();

    description.addFields(
      {
        name: "Start:",
        value: "⏰ " + moment.utc(data.live_at).tz('Asia/Jakarta').locale('id').format('dddd, DD MMMM HH:mm'),
      },
      {
        name: "Title",
        value: data.title,
        inline: false,
      },
      {
        name: "Watch on Web:",
        value: `[Here](${link}) | [Multi Room](https://www.jkt48showroom.com/multi-room-idn)`,
        inline: true,
      },
      {
        name: "Watch on IDN Live:",
        value: `[Here](https://www.idn.app/${data.user.username}/live/${data.slug})`,
        inline: true,
      }
    );

    webhookClient.send({
      username: "JKT48 SHOWROOM BOT",
      avatarURL:
        "https://media.discordapp.net/attachments/1108380195175551047/1134155015242666015/Flag_Fix.png?width=610&height=607",
      embeds: [description],
    });
  } catch (error) {
    console.error("Error sending webhook notification:", error);
  }
}

async function getLiveInfo(rooms) {
  for (const member of rooms) {
    let name;

    const liveId = member.slug;
    const liveDatabase = await collection.find().toArray();
    const liveIds = liveDatabase.map((obj) => obj.live_id);

    console.log(rooms);

    if (rooms.length) {
      if (liveIds.includes(liveId)) {
        console.log(
          redBright(
            `Already notified for ${member.user.name} live ID ${liveId}`
          )
        );
      } else {
        // send notification discord and insert the live id into the database
        sendMobileFirebaseNotif(member);
        sendWebhookNotification(member);
        await collection.insertOne({
          room_id: member.user.id,
          live_id: member.slug,
          username: member.user.username,
          image: member.user.avatar,
          name: member.user.name,
          date: member.live_at,
        });
        console.log(
          green(`Member ${member.user.name} is Live Sending notification...`)
        );
      }
    } else {
      console.log(redBright("No one member lives"));
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

const getIDNLives = async (req, res) => {
  try {
    const response = await axios.post(
      "https://api.idn.app/graphql",
      {
        query:
          'query SearchLivestream { searchLivestream(query: "", limit: 100) { next_cursor result { slug title image_url view_count playback_url room_identifier status live_at end_at scheduled_at gift_icon_url category { name slug } creator { uuid username name avatar bio_description following_count follower_count is_follow } } }}',
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data?.data.searchLivestream?.result;
    if (data?.length) {
      const result = data.filter((i) => {
        return idnUsernames.includes(i.creator?.username || "0");
      });
      return result.map((i) => {
        return {
          user: {
            id: i.creator?.uuid,
            name: i.creator?.name,
            username: i.creator?.username,
            avatar: i.creator?.avatar,
          },
          image: i.image_url,
          stream_url: i.playback_url,
          title: i.title,
          slug: i.slug,
          view_count: i.view_count,
          live_at: new Date(i.live_at).toISOString(),
        };
      });
    }
  } catch (error) {
    console.error("Error fetching IDN lives:", error);
    res.send({
      message: "Internal Server Error",
    });
  }
};

let cronJob;

const IDNLiveNotif = {
  sendDiscordNotif: async (req, res) => {
    try {
      if (cronJob) {
        cronJob?.destroy();
      }

      const roomLives = await getIDNLives();
      await getLiveInfo(roomLives);
      getScheduledJobTime();

      if (roomLives?.length > 0) {
        console.log("IDN Live Notif send to discord");
      } else {
        console.log(redBright("No one member IDN Lives"));
      }
    } catch (error) {
      console.error("Error fetching IDN lives:", error);
      res.send({
        message: "Internal Server Error",
      });
    }
  },
};

module.exports = IDNLiveNotif;
