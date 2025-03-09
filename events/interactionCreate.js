// events/interactionCreate.js
module.exports = async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      // Only reply if the interaction hasn't been replied to already
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: 'There was an error executing this command.',
            ephemeral: true,
          });
        } catch (replyError) {
          console.error('Error sending error reply:', replyError);
        }
      }
    }
  }
};
