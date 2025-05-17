const axios = require("axios");
const { blueBright } = require("colorette");
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

      const headers = {
        headers: {
          Authorization: `Bearer ${process.env.MESSAGE_BOT_TOKEN}`
        }
      }

      // Auto Input Schedules Every sunday and monday at 11 pm
      cron.schedule("00 23 * * 0,1", async () => {
        await axios.get(`${process.env.SHOWROOM_ADMIN_WEB}/schedules/auto-schedules`, {
          headers
        })
          .then((res) => {
            console.log(blueBright("Theater Schedules Created"));
          })
          .catch((error) => {
            console.error("Error creating schedules:", error);
          });
      });


      res.send({
        message: "Today Schedule running",
      });

    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Job Today Schedule already running",
      });
    }
  }
};

module.exports = TodaySchedule;

