import fetch from 'node-fetch';
import 'dotenv/config';
import { getValidAccessToken, generateAccessToken } from './paypalAuthenticationService.js';

const { BASE_URL } = process.env;

/**
 * Create an order using PayPal Orders V2 REST API.
 */
const createOrder = async (req, res) => {
  try {
    // Extract relevant parameters from the request
    const returnURL = "";
    const cancelURL = "";
    const currencyCode = "USD";
    const value = "100.00";
    const invoiceNumber = "invnum";

    // Construct the order payload based on the mappings provided
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: value,
            breakdown: {
              item_total: {
                currency_code: currencyCode,
                value: value
              }
            }
          },
          invoice_id: invoiceNumber,
          description: 'Order description', // Assuming a static description; adjust as needed
          shipping: {
            name: {
              full_name: 'Recipient Name' // Placeholder; replace with actual data if available
            }
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: returnURL,
            cancel_url: cancelURL
          }
        }
      }
    };

    // Get a valid access token
    var accessToken = await getValidAccessToken();

    // Make the API request to PayPal
    var response = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderData)
    });

    // If the response status is 403, try to generate a new access token and retry the request
    if (response.status === 403) {
      accessToken = await getValidAccessToken(true); // Force token refresh
      response = await fetch(`${BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      });
    }

    // Parse the JSON response
    const jsonResponse = await response.json();

    // Return the JSON response and the HTTP status code
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update an order with the given parameters.
 * @param {string} orderID - The ID of the order to update.
 * @returns {Promise<object>} - The response from the PayPal API.
 */
const updateOrder = async (req, res, orderID) => {
  var accessToken = await getValidAccessToken();
  const url = `${BASE_URL}/v2/checkout/orders/${orderID}`;

  // Extract relevant parameters from nvpParams
  const amount = "110.00";
  const currencyCode = "USD";
  const invoiceNumber = "invNum";

  // Construct the patch request payload based on the mapping rules
  const patchData = [
    {
      op: "add",
      path: "/purchase_units/@reference_id=='default'/amount",
      value: {
        currency_code: currencyCode,
        value: amount
      }
    },
    {
      op: "add",
      path: "/purchase_units/@reference_id=='default'/invoice_id",
      value: invoiceNumber
    }
    // Add more mappings as needed based on the provided mapping rules
  ];

  var response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(patchData)
  });

  // If the response status is 403, try to generate a new access token and retry the request
  if (response.status === 403) {
    accessToken = await getValidAccessToken(true); // Force token refresh
    response = await fetch(url, {
      method: 'PATCH',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(patchData),
    });
  }
  const jsonResponse = await response.json();
  return {
    jsonResponse,
    httpStatusCode: response.status
  };
};

/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${BASE_URL}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const jsonResponse = await response.json();
  return {
    jsonResponse,
    httpStatusCode: response.status,
  };
};

/**
 * Get the order details.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_get
 */
const getOrderDetails = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${BASE_URL}/v2/checkout/orders/${orderID}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const jsonResponse = await response.json();
  return {
    jsonResponse,
    httpStatusCode: response.status,
  };
};


export { createOrder, updateOrder, captureOrder, getOrderDetails };