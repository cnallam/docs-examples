import express from "express";
import "dotenv/config";
import { createOrder, captureOrder, updateOrder, getOrderDetails } from './paypalOrderService.js';
import path from 'path';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8888;

// Create an order (SetExpressCheckout equivalent)
app.post("/api/orders", async (req, res) => {
  try {
    const { returnUrl, cancelUrl, currencyCode, value, invoiceNumber } = req.body;
    const cart = {
      returnUrl,
      cancelUrl,
      currencyCode,
      value,
      invoiceNumber
    };
    const { jsonResponse, httpStatusCode } = await createOrder(cart);
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Capture an order (DoCapture equivalent)
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

// update an order (DoExpressCheckoutPayment equivalent)
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

// Serve static files from the public directory
app.use(express.static('public'));

// serve index.html
app.get("/", (req, res) => {
  res.redirect("/checkout.html");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});