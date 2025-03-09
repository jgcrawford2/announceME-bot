// commands/announcement.js
const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('announcement_creation')
      .setDescription('Create a new announcement with AI-powered formatting'),
  
    async execute(interaction) {
      // 1) Build a Modal
      const modal = new ModalBuilder()
        .setCustomId('announcementModal')
        .setTitle('Announcement Creation');
  
      // 2) Create a Text Input for the announcement
      const announcementInput = new TextInputBuilder()
        .setCustomId('announcementInput')
        .setLabel('What is your announcement?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
  
      // 3) Put the input in an ActionRow
      const firstActionRow = new ActionRowBuilder().addComponents(announcementInput);
  
      // 4) Add the ActionRow to the Modal
      modal.addComponents(firstActionRow);
  
      // 5) Show the modal to the user
      await interaction.showModal(modal);
    },
  };
  