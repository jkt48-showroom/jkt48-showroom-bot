const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");

const webhookClients = new Discord.WebhookClient({
  id: "1168086696668172358",
  token: "3D1CSpUsctkpkGSNpe-OEk2_5YKDXmpMt7FPkSWEDgkeHYnvVeLX0GdB0YyWbWdgVLwr",
});

const slugify = (text) => {
  return text.toLowerCase().replace(/\s+/g, "-");
};

async function sendSharingLiveNotif(sharingId, message, discordName) {
  const sharingDetail = await axios.get(
    `https://showroom-admin.ikhbaldwiyan.repl.co/sharing-live/${sharingId}`
  );

  const data = sharingDetail.data;

  const url = `https://jkt48-showroom-git-feat-sharing-live-ikhbaldwiyan.vercel.app/sharing/${slugify(
    data?.schedule_id?.setlist?.name
  )}/${data?.schedule_id?._id}`;

  const dayName = moment(data?.schedule_id?.showDate)
    .locale("id")
    .format("dddd");

  const embed = new Discord.EmbedBuilder()
    .setTitle(`**Detail Order - #${data?.order_id}**`)
    .setColor("#23889a")
    .setImage(
      data?.schedule_id.setlist?.image ??
        "https://images-ext-2.discordapp.net/external/KSMPWx8RGJBmlgem6E5MTPdVfujwCjRB8-SNoE85O8A/%3Fv%3D1683304746/https/static.showroom-live.com/image/room/cover/73f495d564945090f4af7338a42ce09ffa12d35fbfa8ce35c856220bcf96c5f3_m.png?width=921&height=518"
    )
    .setURL(url)
    .setThumbnail(data?.image)
    .setFooter({
      text: "Silahkan chat admin untuk pembayaran",
      iconURL:
        "https://cdn.discordapp.com/avatars/666536214492348426/faadd2076a59a42305240d5aab26fc77.png",
    })
    .setTimestamp();

  embed.addFields(
    {
      name: "Discord Account",
      value: discordName ?? "-",
      inline: true,
    },
    {
      name: "Setlist",
      value: `♫ ${data?.schedule_id?.setlist?.name}`,
      inline: true,
    },
    {
      name: "Show Date",
      value: `🗓 ${dayName}, ${moment(data.schedule_id.showDate).format(
        "DD MMMM"
      )} - ${data.schedule_id?.showTime} WIB `,
      inline: false,
    }
  );

  const customMessage = {
    username: "SHARING LIVE BOT",
    avatarURL:
      "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    content: message,
    embeds: [embed],
  };

  webhookClients.send(customMessage);
}

const DiscordMessagesBot = {
  sendNotifDiscord: async (req, res) => {
    const { message, sharingId, discordName } = req.body;
    try {
      sendSharingLiveNotif(sharingId, message, discordName);

      res.send({
        message: `Notif sharing live send to discord server`,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  },
};

module.exports = DiscordMessagesBot;
