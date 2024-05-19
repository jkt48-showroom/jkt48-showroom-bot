const Discord = require("discord.js");
const axios = require("axios");
const moment = require("moment");
const momentTimezone = require("moment-timezone");
const sendNotifMobile = require("../utils/sendNotifMobile");
const { green } = require("colorette");
require("dotenv").config();

// Discord channel for jadwal-theater
const webhookClientTheater = new Discord.WebhookClient({
  id: process.env.ID_THEATER_CHANNEL,
  token: process.env.TOKEN_THEATER_CHANNEL,
});

const getGreeting = () => {
  const indonesiaTime = momentTimezone().tz("Asia/Jakarta");
  const time = indonesiaTime.hours();

  if (time < 12) {
    return "Selamat pagi";
  } else if (time < 15) {
    return "Selamat siang";
  } else if (time < 18) {
    return "Selamat sore";
  } else if (time > 18) {
    return "Selamat malam";
  } else {
    return "Selamat malam";
  }
};

async function sendScheduleNotifAndroid(schedule, isUpdateLineup) {
  const showDate = moment(schedule?.showDate).locale("id").format("dddd DD MMM");

  let title = "JKT48 SHOWROOM";
  let messageBody = `Jadwal show ${schedule?.setlist?.name} - ${showDate}`;

  if (isUpdateLineup) {
    title = `${schedule?.setlist?.name} - ${showDate}`;
    messageBody = `Line up member sudah di update`;
  } else if (schedule?.isBirthdayShow) {
    messageBody += ` (Birthday ${schedule?.birthdayMember?.stage_name})`;
  } else if (schedule.isGraduationShow) {
    messageBody += ` (Graduation ${schedule.graduateMember?.stage_name})`;
  }

  const payload = {
    to: "/topics/showroom",
    notification: {
      title: title,
      body: messageBody,
      mutable_content: true,
      sound: "Tri-tone",
      icon: "https://res.cloudinary.com/dkkagbzl4/image/upload/v1715448389/ioc8l1puv69qn7nzc2e9.png",
      image: schedule?.setlist?.image,
    },
    data: {
      name: schedule?.setlist?.name,
      type: "Schedule",
      image: schedule?.setlist?.image,
      screen: "ScheduleDetail",
      schedule_id: schedule._id,
      setlist: {
        name: schedule?.setlist?.name,
      },
    },
  };
  
  try {
    sendNotifMobile(payload);

    console.log(
      green(
        `Sending theater schedule ${schedule?.setlist?.name} to mobile notif success`
      )
    );
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

async function getNotifTheaterSchedule(image, isUpdateLineup = false) {
  try {
    const response = await axios.get(
      `${process.env.SHOWROOM_ADMIN_WEB}/schedules`
    );
    const theaterSchedule = response.data;

    const embed = new Discord.EmbedBuilder()
      .setTitle("Jadwal Theater Showroom")
      .setColor("#23889a")
      .setImage(image)
      .addFields({ name: " ", value: " ------------------- " })
      .setURL(`${process.env.JKT48_SHOWROOM_WEB}/theater-schedule`)
      .setThumbnail(
        "https://assets.ayobandung.com/crop/0x0:0x0/750x500/webp/photo/2023/02/02/2927366731.jpeg"
      )
      .setTimestamp();

    const slugify = (text) => text.toLowerCase().replace(/\s+/g, "-");

    const isEmpty = (value) => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === undefined || value === null || value === "";
    };

    const isComingSoon = theaterSchedule
      .filter((schedule) => schedule.isOnWeekSchedule)
      .some((item) => isEmpty(item.memberList));

    const greeting = getGreeting(); // Assuming you have getGreeting() defined somewhere

    let message = isComingSoon
      ? `${greeting} <@&1082078422097989843>, berikut jadwal show theater minggu ini`
      : `${greeting} <@&1082078422097989843>, berikut jadwal show theater dan lineup member minggu ini`;

    theaterSchedule
      .filter((schedule) => schedule.isOnWeekSchedule)
      .forEach((schedule) => {
        const dayName = moment(schedule?.showDate).locale("id").format("dddd");
        const url = `${process.env.JKT48_SHOWROOM_WEB}/theater/${slugify(
          schedule?.setlist?.name
        )}/${schedule._id}`;

        embed.addFields(
          { name: `**${schedule?.setlist?.name}**`, value: " " },
          {
            name: "Tanggal :",
            value: `🗓 ${dayName}, ${moment(schedule?.showDate).format(
              "DD MMM"
            )}`,
            inline: true,
          },
          {
            name: "Waktu :",
            value: `🕓 ${schedule?.showTime} WIB`,
            inline: true,
          }
        );

        if (schedule?.memberList.length) {
          embed.addFields({
            name: "Members",
            value: schedule?.memberList
              .map((member) => member?.stage_name)
              .join(", "),
          });
        }

        if (schedule?.isBirthdayShow) {
          embed.addFields({
            name: "Birthday",
            value: `🎂 ${schedule.birthdayMember?.stage_name}`,
          });
        }

        if (schedule?.isGraduationShow) {
          embed.addFields({
            name: "Graduation",
            value: `👩🏼‍🎓 ${schedule.graduateMember?.stage_name}`,
          });
        }

        embed.addFields({ name: "Detail Theater", value: `[Here](${url})` });

        if (isUpdateLineup) {
          sendScheduleNotifAndroid(schedule, true);
        } else {
          sendScheduleNotifAndroid(schedule, false);
        }

      });

    webhookClientTheater.send({
      username: "JKT48 SHOWROOM BOT",
      avatarURL:
        "https://media.discordapp.net/attachments/1108380195175551047/1111706299273592842/Group_42_1.png?width=612&height=612",
      content: message,
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error fetching or processing theater schedule:", error);
  }
}

const TheaterSchedule = {
  getTheaterNotification: async (req, res) => {
    try {
      await getNotifTheaterSchedule(req.body.image, req.body.isUpdateLineup);

      res.send({
        message: "Jadwal Theater Success send to discord server!",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending theater schedule");
    }
  },

  getTheaterShowroom: async (req, res) => {
    try {
      res.send({
        message: "Jadwal Theater Success send to discord server!",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending theater schedule");
    }
  },
};

module.exports = TheaterSchedule;
