const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const momentTimezone = require("moment-timezone");


const webhookClients = {
  general: new Discord.WebhookClient({
    id: "1092835883608199168",
    token: "6A8do70bBQXAveFS1o7G5R1D4_rnuLDalpCJM1VllihMSNFf9GBjFjK7LVlLYW1yBo2l",
  }),
  twitter: new Discord.WebhookClient({
    id: "1121642960140894239",
    token: "WCc8xTDzH-oR_ajmlUTbGagXSZvXe17RsYqshjf682dOE9tU25M9jgX31aLLZUiJD7Jh",
  }),
  announcement: new Discord.WebhookClient({
    id: "1130507690074968216",
    token: "EoYUSXdllCzxg9M4LzsCQycTXYiWrWJ-sbKJgCz6A2TuqYz54cgwCFXaDX29p0-YYbKS",
  }),
  development: new Discord.WebhookClient({
    id: "1130771451658637352",
    token: "omrj2_m4Bn-HnGx3MYQFBIDWUjM75WKcooJ2GoTNvNHD3YtmBxByw2utmx5x_UYW9xrE"
  }),
  theater: new Discord.WebhookClient({
    id: "1106146275851771955",
    token: "VmQ6ypkd4TpIJoQsob3_AkbkSTSmoHbNdfUvz50cLgwd7lMcaxJoZtpQjn1CYA3UeaSM"
  }),
  sharing: new Discord.WebhookClient({
    id: "1168086696668172358",
    token: "3D1CSpUsctkpkGSNpe-OEk2_5YKDXmpMt7FPkSWEDgkeHYnvVeLX0GdB0YyWbWdgVLwr"
  }),
};

function sendWebhookMessage(type, message) {
  const customMessage = {
    username: 'JKT48 SHOWROOM BOT',
    avatarURL: "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    content: message,
  };

  if (type in webhookClients) {
    webhookClients[type].send(customMessage);
  } else {
    console.log("Invalid webhook type:", type);
  }
}

function sendWebhookMessageSharingLive(data, message) {
  const customMessage = {
    username: 'JKT48 SHOWROOM BOT',
    avatarURL: "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    content: message,
    embeds: [embed]
  };

  const embed = new Discord.EmbedBuilder()
    .setTitle(`**Detail Sharing Live - ${data?.setlist?.name}**`)
    .setColor("#23889a")
    .setImage(data?.setlist?.image ?? "https://images-ext-2.discordapp.net/external/KSMPWx8RGJBmlgem6E5MTPdVfujwCjRB8-SNoE85O8A/%3Fv%3D1683304746/https/static.showroom-live.com/image/room/cover/73f495d564945090f4af7338a42ce09ffa12d35fbfa8ce35c856220bcf96c5f3_m.png?width=921&height=518")
    .setURL(url)
    .setTimestamp();



  sharing.send(customMessage);

}

const getGreeting = () => {
  const indonesiaTime = momentTimezone().tz('Asia/Jakarta');
  const time = indonesiaTime.hours();

  if (time < 12) {
    return 'Selamat pagi';
  } else if (time < 15) {
    return 'Selamat siang';
  } else if (time < 18) {
    return 'Selamat sore';
  } else if (time > 18) {
    return 'Selamat malam';
  } else {
    return 'Selamat malam';
  }
};


async function sendMessageTheaterInfo(scheduleId, type) {
  const response = await axios.get(`https://showroom-admin.vercel.app/schedules/${scheduleId}`);
  const schedule = response.data;


  // Function to convert a string to a slug
  const slugify = (text) => {
    return text.toLowerCase().replace(/\s+/g, "-");
  };

  const url = `https://jkt48-showroom.vercel.app/theater/${slugify(schedule?.setlist?.name)}/${schedule._id}`;

  const embed = new Discord.EmbedBuilder()
    .setTitle(`**${schedule?.setlist?.originalName} - ${schedule?.setlist?.name}**`)
    .setColor("#23889a")
    .setImage(schedule?.setlist?.image ?? "https://images-ext-2.discordapp.net/external/KSMPWx8RGJBmlgem6E5MTPdVfujwCjRB8-SNoE85O8A/%3Fv%3D1683304746/https/static.showroom-live.com/image/room/cover/73f495d564945090f4af7338a42ce09ffa12d35fbfa8ce35c856220bcf96c5f3_m.png?width=921&height=518")
    .setURL(url)
    .setTimestamp();


  const dayName = moment(schedule?.showDate).locale("id").format("dddd");
  embed.addFields(
    { name: "Tanggal :", value: `🗓 ${dayName}, ${moment(schedule.showDate).format("DD MMMM")} `, inline: true },
    { name: "Waktu :", value: "🕓 " + schedule?.showTime + " WIB", inline: true },
    { name: "Member :", value: schedule?.memberList.length !== 0 ? schedule?.memberList?.map(member => member?.stage_name).join(', ') : "Coming Soon" },

  );

  if (schedule?.isBirthdayShow) {
    embed.addFields(
      { name: schedule?.isBirthdayShow ? "Birthday" : " ", value: schedule.birthdayMember?.stage_name ?? " ", inline: true });
  }

  if (schedule?.isGraduationShow) {
    embed.addFields(
      { name: schedule?.isGraduationShow ? "Graduation" : " ", value: schedule.graduateMember?.name ?? " ", inline: true });
  }

  embed.addFields({ name: " ", value: `[Detail Theater](${url})` })

  const message = `${getGreeting()} <@&1082078422097989843> jangan lupa hari ini ada show **${schedule?.setlist?.name}**, berikut info show theater lebih lanjut`;

  const customMessage = {
    username: 'JKT48 SHOWROOM BOT',
    avatarURL: "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    content: message,
    embeds: [embed]
  };


  if (type in webhookClients) {
    webhookClients[type].send(customMessage);
  } else {
    console.log("Invalid webhook type:", type);
  }
}

const DiscordMessagesBot = {
  getMessageBot: async (req, res) => {
    const { type, message, messageType, scheduleId } = req.body;
    try {

      if (messageType === 'schedule') {
        sendMessageTheaterInfo(scheduleId, type)
      } else {
        sendWebhookMessage(type, message);
      }

      res.send({
        message: `${messageType === 'chat' ? "Discord message" : "Theater schedule"} sent to ${type} channel`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  },
};

module.exports = DiscordMessagesBot;
