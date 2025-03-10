const { SlashCommandBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('decision_help')
    .setDescription('Get casual advice on a decision based on recent chat')
    .addStringOption(option =>
      option.setName('timeframe')
        .setDescription('How far back to look at messages')
        .setRequired(true)
        .addChoices(
          { name: '1 hour', value: '1h' },
          { name: '3 hours', value: '3h' },
          { name: '8 hours', value: '8h' },
          { name: '24 hours', value: '24h' },
          { name: '48 hours', value: '48h' }
        )
    )
    .addStringOption(option =>
      option.setName('question')
        .setDescription('What decision do you need help with?')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Defer the reply since this might take some time
    await interaction.deferReply();

    try {
      // Get the selected timeframe and question
      const timeframe = interaction.options.getString('timeframe');
      const question = interaction.options.getString('question');
      
      // Calculate the timestamp for the selected timeframe
      const now = new Date();
      let timeLimit;
      
      switch (timeframe) {
        case '1h':
          timeLimit = new Date(now.getTime() - (1 * 60 * 60 * 1000));
          break;
        case '3h':
          timeLimit = new Date(now.getTime() - (3 * 60 * 60 * 1000));
          break;
        case '8h':
          timeLimit = new Date(now.getTime() - (8 * 60 * 60 * 1000));
          break;
        case '24h':
          timeLimit = new Date(now.getTime() - (24 * 60 * 60 * 1000));
          break;
        case '48h':
          timeLimit = new Date(now.getTime() - (48 * 60 * 60 * 1000));
          break;
        default:
          timeLimit = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // Default to 1 hour
      }

      // Fetch messages from the channel
      const messages = await fetchMessages(interaction.channel, timeLimit);
      
      if (messages.length === 0) {
        return interaction.editReply('No messages found in the selected timeframe. Try a longer timeframe or ask your question without context.');
      }

      // Format messages for the AI
      const formattedMessages = formatMessagesForAI(messages);
      
      // Generate decision help based on chat history
      const advice = await generateDecisionHelp(formattedMessages, question, timeframe);
      
      // Send the advice
      await interaction.editReply({
        content: advice,
      });
      
    } catch (error) {
      console.error('Error in decision_help command:', error);
      await interaction.editReply({
        content: 'Sorry, something went wrong while trying to help with your decision.',
      });
    }
  },
};

// Helper function to fetch messages from a channel
async function fetchMessages(channel, timeLimit) {
  const messages = [];
  let lastId;
  let options = { limit: 100 }; // Discord API allows fetching up to 100 messages at once
  
  // Keep fetching messages until we reach the time limit or there are no more messages
  while (true) {
    if (lastId) {
      options.before = lastId;
    }
    
    const fetchedMessages = await channel.messages.fetch(options);
    
    if (fetchedMessages.size === 0) break;
    
    // Filter out bot messages and commands
    const relevantMessages = fetchedMessages.filter(msg => {
      // Check if the message is within our time limit
      return msg.createdAt >= timeLimit && 
             // Exclude bot messages if needed
             !msg.author.bot &&
             // Exclude command messages
             !msg.content.startsWith('/');
    });
    
    messages.push(...relevantMessages.values());
    
    // Update the last message ID for pagination
    lastId = fetchedMessages.last().id;
    
    // If the oldest message is older than our time limit, we can stop
    if (fetchedMessages.last().createdAt < timeLimit) break;
    
    // Safety check to prevent infinite loops
    if (messages.length >= 1000) break;
  }
  
  return messages;
}

// Helper function to format messages for the AI
function formatMessagesForAI(messages) {
  return messages.map(msg => {
    return {
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt.toISOString()
    };
  });
}

// Helper function to generate decision help using OpenAI
async function generateDecisionHelp(formattedMessages, question, timeframe) {
  try {
    // Initialize the OpenAI client using the GitHub token and GPT-4o endpoint
    const client = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    });
    
    // Convert the messages to a readable format
    const messagesText = formattedMessages.map(msg => 
      `${msg.author} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.content}`
    ).join('\n');
    
    // Call the chat completion API to generate decision help
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a chill, laid-back Discord user who helps people make decisions. You talk in casual, relaxed language - like texting a friend. Keep your responses short and to the point. Don't use markdown formatting or fancy structure. Just give straightforward, personal advice like a real person would. Be friendly but not overly enthusiastic. Use some casual slang but don't overdo it. Your goal is to sound like a real Discord user, not a formal assistant."
        },
        {
          role: "user",
          content: `Based on this chat history from the past ${getTimeframeLabel(timeframe)}, I need help with this decision: ${question}\n\nChat history:\n${messagesText}`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate decision help');
  }
}

// Helper function to get a human-readable timeframe label
function getTimeframeLabel(timeframe) {
  switch (timeframe) {
    case '1h': return '1 hour';
    case '3h': return '3 hours';
    case '8h': return '8 hours';
    case '24h': return '24 hours';
    case '48h': return '48 hours';
    default: return timeframe;
  }
} 