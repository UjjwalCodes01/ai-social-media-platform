const axios = require('axios');

class LinkedInService {
  constructor() {
    this.clientId = process.env.LINKEDIN_CLIENT_ID;
    this.clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    this.baseURL = 'https://api.linkedin.com/v2';
  }

  // Get authorization URL
  getAuthorizationURL(redirectUri, state) {
    const scope = 'r_liteprofile,r_emailaddress,w_member_social';
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
  }

  // Exchange code for access token
  async getAccessToken(code, redirectUri) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Get user profile
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/people/~:(id,firstName,lastName,emailAddress)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return { success: true, profile: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }

  // Post to LinkedIn
  async createPost(accessToken, userId, content) {
    try {
      const postData = {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(`${this.baseURL}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return { success: true, post: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
}

module.exports = LinkedInService;