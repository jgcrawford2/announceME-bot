// events/interactionCreate.js
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const { InteractionType } = require('discord.js');

// Setup OpenAI
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async (interaction) => {
  // 1) Slash Command Execution
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true
      });
    }
  }

  // 2) Modal Submission
  else if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === 'announcementModal') {
      // Retrieve user input
      const userAnnouncement = interaction.fields.getTextInputValue('announcementInput');

      // Use OpenAI to format the announcement
      try {
        const response = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an AI that formats announcements with:
- Professional style
- Correct Markdown usage
- A light sprinkle of emojis 
- An exciting yet respectful tone`
            },
            {
              role: 'user',
              content: `Please format this announcement:\n\n${userAnnouncement}`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        });

        const formattedAnnouncement = response.data.choices[0].message.content.trim();

        // Reply in the channel with the formatted announcement
        await interaction.reply({
          content: `**Here is your AI-formatted announcement:**\n\n${formattedAnnouncement}`,
          ephemeral: false
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Sorry, there was an error generating your announcement.',
          ephemeral: true
        });
      }
    }
  }
};
