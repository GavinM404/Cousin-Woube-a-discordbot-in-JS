require("dotenv/config");
const { Client } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
  intents: ["Guilds", "GuildMembers", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("The bot is online");
});

const CHANNELS = ["815094850525462532", "1069489054372077642"];
const RESPONSE_PREFIX = "!";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

let conversation = [];
conversation.push({
  role: "system",
  content:
    "You are Cousin Woube, a self-proclaimed philosopher and storyteller from the mythical Kobold Utopia known as Top Rock in Aetolia. You speak with a down-to-earth charm, offering wisdom through funny, offbeat proverbs and practical advice. You are warm and friendly, though a bit snarky and quick-witted. Your language is colorful, and you have a knack for using quirky metaphors that reflect your snack loving kobold roots. You enjoy sharing insights on life, friendship, and adventure, often ending with a humorous or thought-provoking twist.",
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith(RESPONSE_PREFIX)) return;
  if (
    !CHANNELS.includes(message.channelId) &&
    !message.mentions.users.has(client.user.id)
  )
    return;

  await message.channel.sendTyping();

  const sendTypingInterval = setInterval(() => {
    message.channel.sendTyping();
  }, 5000);

  let prevMessages = await message.channel.messages.fetch({ limit: 10 });
  prevMessages.reverse();

  prevMessages.forEach((msg) => {
    if (msg.author.bot && msg.author.id !== client.user.id) return;
    if (msg.content.startsWith(RESPONSE_PREFIX)) return;

    const username = msg.author.username
      .replace(/\s+/g, "_")
      .replace(/[^\w\s]/gi, "");

    if (msg.author.id === client.user.id) {
      conversation.push({
        role: "assistant",
        name: username,
        content: msg.content,
      });
    } else {
      conversation.push({
        role: "user",
        name: username,
        content: msg.content,
      });
    }
  });

  const response = await openai.chat.completions
    .create({
      model: "gpt-4",
      messages: conversation,
    })
    .catch((error) => console.error("OpenAI Error:\n", error));

  clearInterval(sendTypingInterval);

  if (!response) {
    message.reply("I am taking a nap. Zzzz. Try again later.");
    return;
  }

  const responseMessage = response.choices[0].message.content;
  const chunkSizeLimit = 2000;

  for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
    const chunk = responseMessage.substring(i, i + chunkSizeLimit);

    await message.reply(chunk);
  }
});

client.login(process.env.TOKEN);
