const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const getTimes = require("../utils/getTimes");
const momentTimezone = require("moment-timezone");

// Discord channel for live-notification
const webhookClientTheater = new Discord.WebhookClient({
  id: process.env.ID_THEATER_CHANNEL,
  token: process.env.TOKEN_THEATER_CHANNEL,
});

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


async function getNotifTheaterSchedule(image) {
  try {
    const response = await axios.get('https://showroom-admin.vercel.app/schedules');
    const theaterSchedule = response.data;

    const embed = new Discord.EmbedBuilder()
      .setTitle('Jadwal Theater Showroom')
      .setColor('#23889a')
      .setImage(image)
      .addFields({ name: ' ', value: ' ------------------- ' })
      .setURL('https://jkt48-showroom.vercel.app/theater-schedule')
      .setThumbnail('https://assets.ayobandung.com/crop/0x0:0x0/750x500/webp/photo/2023/02/02/2927366731.jpeg')
      .setTimestamp();

    const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-');

    const isEmpty = (value) => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === null || value === '';
    };

    const isComingSoon = theaterSchedule
      .filter((schedule) => schedule.isOnWeekSchedule)
      .some((item) => isEmpty(item.memberList));

    console.log(isComingSoon);

    const greeting = getGreeting(); // Assuming you have getGreeting() defined somewhere

    let message = isComingSoon
      ? `${greeting} <@&1082078422097989843>, berikut jadwal show theater minggu ini`
      : `${greeting} <@&1082078422097989843>, berikut jadwal show theater dan lineup member minggu ini`;

    theaterSchedule
      .filter((schedule) => schedule.isOnWeekSchedule)
      .forEach((schedule) => {
        const dayName = moment(schedule?.showDate).locale('id').format('dddd');
        const url = `https://jkt48-showroom.vercel.app/theater/${slugify(schedule?.setlist?.name)}/${schedule._id}`;

        embed.addFields(
          { name: `**${schedule?.setlist?.name}**`, value: ' ' },
          { name: 'Tanggal :', value: `🗓 ${dayName}, ${moment(schedule?.showDate).format('DD MMM')}`, inline: true },
          { name: 'Waktu :', value: `🕓 ${schedule?.showTime} WIB`, inline: true }
        );

        if (schedule?.memberList.length) {
          embed.addFields({
            name: 'Members',
            value: schedule?.memberList.map((member) => member?.stage_name).join(', '),
          });
        }

        if (schedule?.isBirthdayShow) {
          embed.addFields({ name: 'Birthday', value: `🎂 ${schedule.birthdayMember?.stage_name}` });
        }

        if (schedule?.isGraduationShow) {
          embed.addFields({ name: 'Graduation', value: `👩🏼‍🎓 ${schedule.graduateMember?.stage_name}` });
        }

        embed.addFields(
          { name: 'Detail Theater', value: `[Here](${url})` }
        );
      });

    webhookClientTheater.send({
      username: 'JKT48 SHOWROOM BOT',
      avatarURL: 'https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612',
      content: message,
      embeds: [embed],
    });
  } catch (error) {
    console.error('Error fetching or processing theater schedule:', error);
  }
}


async function getNotifTheaterScheduleShowroom() {
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
      { name: `${schedule.title}`, value: " " },
      {
        name: "Time :",
        value: getTimes(schedule.start_at) + " WIB",
        inline: true,
      },
      { name: " ", value: `[Buy Ticket](${schedule.entrance_url})` },
      { name: " ", value: " -------------------- " }
    );
  });

  webhookClientTheater.send({
    username: "JKT48 SHOWROOM BOT",
    avatarURL:
      "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
    embeds: [embed],
  });
}

const TheaterSchedule = {
  getTheaterNotification: async (req, res) => {
    try {
      await getNotifTheaterSchedule(req.body.image);

      res.send({
        message: "Jadwal Theater Success send to discord server!",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  },

  getTheaterShowroom: async (req, res) => {
    try {
      res.send({
        message: "Jadwal Theater Success send to discord server!",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  },
};

module.exports = TheaterSchedule;
