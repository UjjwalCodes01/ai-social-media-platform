const { TwitterApi } = require('twitter-api-v2');

class TwitterService {
  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
  }

  // Verify Twitter credentials
  async verifyCredentials() {
    try {
      const user = await this.client.currentUser();
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Post tweet
  async postTweet(content, mediaIds = []) {
    try {
      const tweetOptions = { text: content };
      if (mediaIds.length > 0) {
        tweetOptions.media = { media_ids: mediaIds };
      }
      
      const tweet = await this.client.v2.tweet(tweetOptions);
      return { success: true, tweet };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Upload media
  async uploadMedia(mediaBuffer, mediaType) {
    try {
      const mediaId = await this.client.v1.uploadMedia(mediaBuffer, { 
        mimeType: mediaType 
      });
      return { success: true, mediaId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user's tweets analytics
  async getUserTweets(userId, maxResults = 10) {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: maxResults,
        'tweet.fields': 'public_metrics,created_at'
      });
      return { success: true, tweets };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = TwitterService;