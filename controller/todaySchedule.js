const axios = require("axios");
const cron = require("node-cron");

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

let cronJob;

const TodaySchedule = {
  runTodayScehduleJob: async (req, res) => {
    try {
      if (cronJob) {
        cronJob?.destroy();
      }

      cronJob = cron.schedule("30 12 * * *", async () => {
        const todaySchedule = await getTodayTheaterSchedule();

        if (todaySchedule?.message !== "No theater schedule for today") {
          await sendTodaySchedule();
          console.log(blueBright("Today schedule sent to discord"));
        }
      });
      res.send({
        message: "Today Schedule running",
      });
     
    } catch (error) {
      console.log(error);
      res.status(500).send("Error sending live notification");
    }
  }
};

module.exports = TodaySchedule;

