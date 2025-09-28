const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async generateContent(prompt, platform = 'general', contentType = 'text') {
    try {
      if (!this.apiKey || this.apiKey.includes('your-openai-api-key') || this.apiKey === 'your-openai-api-key-here') {
        throw new Error('❌ OpenAI API key not properly configured. Please:\n1. Get your API key from https://platform.openai.com/account/api-keys\n2. Replace OPENAI_API_KEY in your .env file with the actual key\n3. Restart the server');
      }

      // Create platform-specific context
      const platformContext = this.getPlatformContext(platform);
      
      // Build the full prompt
      const fullPrompt = `${platformContext}\n\nUser request: ${prompt}\n\nGenerate engaging social media content that is appropriate for ${platform}. Include relevant hashtags and make it compelling for the target audience.`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert social media content creator. Create engaging, authentic, and platform-appropriate content. Always include relevant hashtags and make the content actionable or engaging for the audience.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const generatedContent = response.data.choices[0].message.content.trim();
      
      // Extract hashtags from the content
      const hashtags = this.extractHashtags(generatedContent);
      
      return {
        success: true,
        content: generatedContent,
        hashtags,
        platform,
        contentType
      };

    } catch (error) {
      console.error('AI Content Generation Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Invalid OpenAI API key. Please check your configuration.'
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Failed to generate content'
        };
      }
    }
  }

  getPlatformContext(platform) {
    const contexts = {
      'twitter': 'Create content for Twitter with a limit of 280 characters. Be concise, engaging, and use trending hashtags.',
      'linkedin': 'Create professional LinkedIn content. Focus on business insights, industry trends, or professional development. Can be longer form.',
      'instagram': 'Create visually-focused Instagram content. Include emojis, be lifestyle-oriented, and use popular hashtags.',
      'facebook': 'Create Facebook content that encourages community engagement. Can include questions or calls-to-action.',
      'general': 'Create general social media content that works across platforms.'
    };
    
    return contexts[platform.toLowerCase()] || contexts['general'];
  }

  extractHashtags(content) {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = content.match(hashtagRegex) || [];
    return [...new Set(hashtags)]; // Remove duplicates
  }

  async improveContent(originalContent, improvements) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = `Improve this social media content based on these suggestions: ${improvements}\n\nOriginal content: ${originalContent}\n\nProvide an improved version:`;

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Improve the given content while maintaining its core message and making it more engaging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const improvedContent = response.data.choices[0].message.content.trim();
      const hashtags = this.extractHashtags(improvedContent);

      return {
        success: true,
        content: improvedContent,
        hashtags
      };

    } catch (error) {
      console.error('Content Improvement Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message || 'Failed to improve content'
      };
    }
  }
}

module.exports = new AIService();