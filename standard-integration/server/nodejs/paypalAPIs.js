/*
`createOrder` function should be modified to accept cart parameters i.e. itemName, desc etc.. The `cart` parameter represents the shopping cart details that would be used to calculate the order amount and other details.
The `captureOrder` function is called after the buyer approves the payment. The `orderID` is the ID of the order to capture, which would be obtained after the buyer is redirected back to the return URL.
The `getOrderDetails` function retrieves the details of an order by its ID, which can be used to verify the status of the order after the payment is captured.
*/

import express from "express";
import "dotenv/config";
import { createOrder, captureOrder, updateOrder, getOrderDetails } from './paypalOrderService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8888;

// Create an order 
app.post("/api/orders", async (req, res) => {
  try {
    const cart = req.body;
    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Capture an order 
app.post("/api/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to capture order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});

// update an order 
app.put("/api/orders/:orderID", async (req, res) => {
    try {
      const { orderID } = req.params;
      const { jsonResponse, httpStatusCode } = await updateOrder(orderID);
      res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
      console.error("Failed to capture order:", error);
      res.status(500).json({ error: "Failed to capture order." });
    }
  });

// Get order details
app.get("/api/orders/:orderID", async (req, res) => {
  try {
    const { orderID } = req.params;
    const { jsonResponse, httpStatusCode } = await getOrderDetails(orderID);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to get order details:", error);
    res.status(500).json({ error: "Failed to get order details." });
  }
});

// import.meta.url retrieves the URL of the current module.
// fileURLToPath converts the URL to a file path.
// path.dirname() extracts the directory path from the file path.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Serve static files from the project folder
app.use(express.static(path.join(__dirname, '..', '..', 'client')));
// serve index.html
app.get("/", (req, res) => {
  res.redirect("/checkout.html");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});