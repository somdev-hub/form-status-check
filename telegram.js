const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

bot.setWebHook(
  `https://form-status-check.onrender.com/${process.env.TELEGRAM_BOT_TOKEN}`
);

// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
//   webHook: {
//     port: process.env.PORT
//   }
// });

// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

module.exports = bot;
