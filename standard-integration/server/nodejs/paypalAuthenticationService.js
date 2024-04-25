// Import required dependencies
import fetch from 'node-fetch';
import 'dotenv/config';

// Read environment variables
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, BASE_URL } = process.env;

// Cache to store the access token
let accessTokenCache = {
  value: null,
  expiry: null,
};

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 */
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('MISSING_API_CREDENTIALS');
    }
    const auth = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`,
    ).toString('base64');
    const response = await fetch(`${BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description);
    }

    // Set the access token in the cache with the expiry time
    accessTokenCache.value = data.access_token;
    accessTokenCache.expiry = Date.now() + (data.expires_in * 1000);
    return data.access_token;
  } catch (error) {
    console.error('Failed to generate Access Token:', error);
    throw error;
  }
};

/**
 * Get a valid access token from the cache or generate a new one if necessary.
 */
const getValidAccessToken = async () => {
  const { value, expiry } = accessTokenCache;
  const now = Date.now();

  // Check if the token is valid for at least 2 more minutes
  if (value && expiry - now > 120000) {
    return value;
  } else {
    return await generateAccessToken();
  }
};

// Set up a background process to check the validity of the access token
setInterval(async () => {
  try {
    await getValidAccessToken();
  } catch (error) {
    console.error('Error refreshing access token:', error);
  }
}, 60000); // Check every minute

// Export the method to get a valid access token
export { getValidAccessToken, generateAccessToken };