require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const TelegramBot = require("node-telegram-bot-api");
const Participant = require("./models/Participant");
const bot = require("./telegram");

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Telegram bot
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Helper function to get insights
async function getInsights() {
  const yearData = await Participant.aggregate([
    { $group: { _id: "$year", count: { $sum: 1 } } },
  ]);

  const branchData = await Participant.aggregate([
    { $group: { _id: "$branch", count: { $sum: 1 } } },
  ]);

  return {
    yearDistribution: yearData.map((item) => ({
      label: item._id,
      value: item.count,
    })),
    branchDistribution: branchData.map((item) => ({
      label: item._id,
      value: item.count,
    })),
  };
}

// Telegram bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome! Use these commands:\n/year_insights - Get year-wise distribution\n/branch_insights - Get branch-wise distribution\n/all_insights - Get all insights"
  );
});

bot.onText(/\/year_insights/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const insights = await getInsights();
    const yearText = insights.yearDistribution
      .map((item) => `${item.label}: ${item.value} students`)
      .join("\n");
    bot.sendMessage(chatId, `Year-wise Distribution:\n${yearText}`);
  } catch (error) {
    bot.sendMessage(chatId, "Error fetching year insights");
  }
});

bot.onText(/\/branch_insights/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const insights = await getInsights();
    const branchText = insights.branchDistribution
      .map((item) => `${item.label}: ${item.value} students`)
      .join("\n");
    bot.sendMessage(chatId, `Branch-wise Distribution:\n${branchText}`);
  } catch (error) {
    bot.sendMessage(chatId, "Error fetching branch insights");
  }
});

bot.onText(/\/all_insights/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const insights = await getInsights();
    const yearText = insights.yearDistribution
      .map((item) => `${item.label}: ${item.value} students`)
      .join("\n");
    const branchText = insights.branchDistribution
      .map((item) => `${item.label}: ${item.value} students`)
      .join("\n");
    const totalParticipants = insights.yearDistribution.reduce(
      (sum, item) => sum + item.value,
      0
    );
    bot.sendMessage(
      chatId,
      `Year-wise Distribution:\n${yearText}\n\nBranch-wise Distribution:\n${branchText}\n\nTotal Participants: ${totalParticipants}`
    );
  } catch (error) {
    bot.sendMessage(chatId, "Error fetching insights");
  }
});

bot.onText(/\/participants_names/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const participants = await Participant.aggregate([
      { $sort: { year: 1, name: 1 } },
      {
        $group: {
          _id: "$year",
          names: { $push: "$name" },
        },
      },
    ]);

    const messageText = participants
      .map((group) => `Year ${group._id}:\n${group.names.join("\n")}`)
      .join("\n\n");

    bot.sendMessage(chatId, `Participants by Year:\n\n${messageText}`);
  } catch (error) {
    bot.sendMessage(chatId, "Error fetching participants");
  }
});

// API route still available if needed
app.get("/api/insights", async (req, res) => {
  try {
    const insights = await getInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(`/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
