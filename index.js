const express = require('express');
const routerBot = require("./routes/routerBot")
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('image'));

app.listen(3000, () => {
  console.log(`server started at http://localhost:3000`);
});

app.use('/discord', routerBot);


app.get('/', (req, res) => {
  res.redirect("/discord/live-notif-bot")
});
