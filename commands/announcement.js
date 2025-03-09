// commands/announcement.js
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announcement_creation')
    .setDescription('Create a new announcement with AI-powered formatting'),

  async execute(interaction) {
    // Create a modal for the announcement input
    const modal = new ModalBuilder()
      .setCustomId('announcementModal')
      .setTitle('Create an Announcement');

    // Add a text input component
    const announcementInput = new TextInputBuilder()
      .setCustomId('announcementInput')
      .setLabel('Enter your announcement text')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Type your announcement here...')
      .setMinLength(10)
      .setMaxLength(4000);

    // Add the text input to an action row
    const firstActionRow = new ActionRowBuilder().addComponents(announcementInput);

    // Add the action row to the modal
    modal.addComponents(firstActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);

    // Wait for the modal submission
    try {
      const filter = i => i.customId === 'announcementModal';
      const submission = await interaction.awaitModalSubmit({ filter, time: 300000 }); // 5 minutes timeout

      // Get the announcement text from the modal
      const announcementText = submission.fields.getTextInputValue('announcementInput');

      // Show a loading message
      await submission.deferReply();

      try {
        // Initialize the OpenAI client using the GitHub token and GPT-4o endpoint
        const client = new OpenAI({
          baseURL: "https://models.inference.ai.azure.com",
          apiKey: process.env.GITHUB_TOKEN,
        });

        console.log('OpenAI client initialized with baseURL:', "https://models.inference.ai.azure.com");
        console.log('Using token:', process.env.GITHUB_TOKEN ? 'Token exists' : 'Token is missing');
        
        // Call the chat completion API to format the announcement
        console.log('Attempting to call OpenAI API with model: gpt-4o');
        const response = await client.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are an AI that formats announcements with professional style, correct Markdown, and a light sprinkle of emojis. Make it exciting and polished for a community announcement.",
            },
            {
              role: "user",
              content: `Format this announcement:\n\n${announcementText}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        
        console.log('OpenAI API response received successfully');
        const formattedAnnouncement = response.choices[0].message.content.trim();

        // Reply with the formatted announcement in the channel
        await submission.editReply({
          content: `**Here is your AI-formatted announcement:**\n\n${formattedAnnouncement}`,
        });
      } catch (error) {
        console.error('OpenAI API Error Details:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error response:', error.response?.data);
        console.error('Full error:', error);
        
        await submission.editReply({
          content: 'Sorry, there was an error generating your announcement.',
        });
      }
    } catch (error) {
      console.error('Error with modal submission:', error);
      // No need to reply here as the interaction might have timed out
    }
  },
};
