require("dotenv").config();
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");

const bot = new Telegraf(process.env.TELEGRAM_BOT_API_KEY);

bot.start(async (ctx) => {
  await ctx.reply("Welcome to the Social Post Writer Bot");
  // console.log("ctx", ctx);
});

bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message.from;
  console.log(from);
  await ctx.reply("Hello test msg");
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
