require("dotenv").config();
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const User = require("./models/User");
const connectDB = require("./config/db");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_KEY);
(async () => {
  try {
    await connectDB(process.env.DB_URI);
    console.log("DB Connection established...");
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

bot.on(message("text"), async (ctx) => {});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
