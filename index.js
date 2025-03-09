// index.js
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
    // Add more if needed, e.g. for message content, guild members, etc.
  ]
});

// Load Commands into a Collection
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  const eventName = file.split('.')[0]; // e.g. "interactionCreate"
  
  if (eventName === 'ready') {
    client.once('ready', () => event(client));
  } else {
    client.on(eventName, (...args) => event(...args));
  }
}

// Finally, login to Discord
client.login(process.env.DISCORD_TOKEN);
