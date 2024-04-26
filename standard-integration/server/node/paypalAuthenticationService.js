/*
- Environment variables `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `BASE_URL` are read from the `.env` file using the `dotenv` package.
- The `generateAccessToken` function authenticates with PayPal using the client credentials and stores the access token and its expiry time in a cache.
- The `accessTokenCache` object stores the current access token and its expiry time.
- The `getValidAccessToken` function checks if the current token is valid for at least another 2 minutes. If not, it generates a new token.
- The `startAccessTokenValidityCheck` function sets up a background process that runs every minute to ensure the token is always valid.
- The `getValidAccessToken` method is exported for use in other parts of the backend service.
*/
// Import required dependencies
import fetch from 'node-fetch';
import 'dotenv/config';

// Read environment variables
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_BASE_URL } = process.env;

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
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
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

/**
 * Background process to check the validity of the access token every minute.
 */
const startAccessTokenValidityCheck = () => {
  setInterval(async () => {
    try {
      await getValidAccessToken();
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
  }, 60000); // Check every minute
};

// Start the background process when the module is loaded
startAccessTokenValidityCheck();

// Export the method to get a valid access token
export { getValidAccessToken, generateAccessToken };
