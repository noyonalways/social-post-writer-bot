require("dotenv").config();
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const User = require("./models/User");
const connectDB = require("./config/db");
const Event = require("./models/Event");

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_KEY);

(async () => {
  try {
    await connectDB(process.env.DB_URI);
    console.log("DB Connected Successfully ✅");
  } catch (ex) {
    console.error(ex);
    process.kill(process.pid, "SIGTERM");
  }
})();

bot.start(async (ctx) => {
  const from = ctx.update.message.from;

  try {
    await User.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          tgId: from.id,
          firstName: from.first_name,
          username: from.username,
          isBot: from.is_bot,
        },
      },
      { upsert: true, new: true }
    );

    await ctx.reply(
      `Hello ${from.first_name} ${
        from.last_name ? from.last_name : ""
      }!\n I'm a bot that helps you to write your social posts. You can use me to write your social posts.`
    );
  } catch (ex) {
    console.log(ex);
    await ctx.reply("Facing Difficulties...");
  }
});

bot.command("generate", async (ctx) => {
  /**
   * Tasks
   * DONE: 1. Get events for the user in last 24 hours
   * DONE: 2. Make google gemini api call to generate posts events
   * DONE: 4. Send response
   */

  const from = ctx.update.message.from;

  console.log("Generating Posts...⏳");
  const { message_id: messageId } = await ctx.reply(
    `Hey ${from.first_name}, kindly wait for a moment. I am creating posts for you 🚀⏳`
  );
  const { message_id: loadingStickerId } = await ctx.replyWithSticker(
    "CAACAgIAAxkBAANSZhUcKeGCqF10ml5p7yYvnGMrWGAAAgUBAAL3AsgP0eV0t0YlpKE0BA"
  );

  const startOfTheDay = new Date();
  startOfTheDay.setHours(0, 0, 0, 0);

  const endOfTheDay = new Date();
  endOfTheDay.setHours(23, 59, 59, 999);

  const events = await Event.find({
    tgId: from.id,
    createdAt: {
      $gte: startOfTheDay,
      $lte: endOfTheDay,
    },
  });

  if (events.length === 0) {
    await ctx.deleteMessage(messageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply("No events found for this day. Try again later.");
    return;
  }

  try {
    const MODEL_NAME = process.env.GEMINI_MODEL;
    const API_KEY = process.env.GOOGLE_GEMINI_KEY;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const chatPrompt = `Write like a human, for humans, Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. use simple language. Use given time labels just to understand the order of the events, don't mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. Focus on engaging the respective platform's audience, encouraging interaction, and driving interest in the events:\n ${events
      .map((event) => event.text)
      .join(", ")}`;

    const result = await chat.sendMessage(chatPrompt);
    const response = result.response;

    await ctx.deleteMessage(messageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply(response.text());
  } catch (ex) {
    console.log(ex);
    await ctx.deleteMessage(messageId);
    await ctx.deleteMessage(loadingStickerId);
    await ctx.reply("Facing Difficulties. Try again later.");
  }
});

bot.command("help", async (ctx) => {
  await ctx.reply("For get support contact @noyon_rahman");
});

bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message.from;
  const text = ctx.update.message.text;

  try {
    await Event.create({
      tgId: from.id,
      text,
    });

    console.log("Text Message Noted 👍");
    await ctx.reply(
      "Noted 👍, Keep texting me your thoughts. To generate the posts, just enter the command: /generate"
    );
  } catch (ex) {
    console.log(ex);
    await ctx.reply("Facing Difficulties. Try again later.");
  }
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
