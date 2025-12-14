const TelegramBot = require('node-telegram-bot-api');
const Tesseract = require('tesseract.js');
const axios = require('axios');

const BOT_TOKEN = "8454186208:AAE-drl1auodNgoqVZtK4jgv930vNiUB50U";
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const phoneRegex = /(?:\+1[\s.-]?|1[\s.-]?)?\(?([2-9][0-9]{2})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})/g;

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    const fileLink = await bot.getFileLink(fileId);

    const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    const matches = [...text.matchAll(phoneRegex)];

    // delete photo
    bot.deleteMessage(chatId, messageId).catch(() => {});

    if (matches.length === 0) return;

    const numbers = [...new Set(
      matches.map(m => `+1${m[1]}${m[2]}${m[3]}`)
    )];

    // 👉 CODE BLOCK format (tap → copy friendly)
    const messageText =
      "```\n" +
      numbers.join("\n") +
      "\n```";

    const sent = await bot.sendMessage(chatId, messageText, {
      parse_mode: "Markdown"
    });

    // auto delete after 20 min
    setTimeout(() => {
      bot.deleteMessage(chatId, sent.message_id).catch(() => {});
    }, 20 * 60 * 1000);

  } catch (e) {
    console.log(e.message);
  }
});

console.log("Bot is running...");
