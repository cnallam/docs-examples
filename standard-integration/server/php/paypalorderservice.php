<?php
class PayPalOrderService
{
    private $baseUrl;
    private $paypalAuthenticationService;

    public function __construct()
    {
        // Read environment variables for PayPal credentials and base URL
        $this->baseUrl = getenv('BASE_URL');
        $paypalAuthenticationService = new PayPalAuthenticationService();
    }

    public function createOrder()
    {
        // Retrieve the access token from the cache or authentication service
        $accessToken = $paypalAuthenticationService->getValidAccessToken();
        $currencyCodeType = "USD";
        $paymentAmount = 100.00,
        $returnURL = "https://example.com/return"
        $cancelURL = "https://example.com/cancel"

        // Prepare the order data payload
        $orderData = [
            'intent' => 'CAPTURE',
            'purchase_units' => [
                [
                    'amount' => [
                        'currency_code' => $currencyCodeType,
                        'value' => $paymentAmount
                    ],
                    'shipping' => [
                        // Add shipping details here if available
                    ],
                    'items' => [
                        // Add item details here if available
                    ]
                ]
            ],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'return_url' => $returnURL,
                        'cancel_url' => $cancelURL,
                        'landing_page' => 'LOGIN', // Assuming LOGIN as default
                        'shipping_preference' => 'SET_PROVIDED_ADDRESS', // Assuming SET_PROVIDED_ADDRESS as default
                        'user_action' => 'PAY_NOW' // Assuming PAY_NOW as default
                    ]
                ]
            ]
        ];

        // Initialize cURL session
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, "{$this->baseUrl}/v2/checkout/orders");
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer $accessToken"
        ]);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($orderData));

        // Execute cURL request
        $result = curl_exec($curl);
        $info = curl_getinfo($curl);

        // Check for errors and handle the response
        if ($info['http_code'] != 201) {
            if ($info['http_code'] == 403) {
                // Fallback logic: If status is 403, generate a new access token
                $accessToken = $this->generateNewAccessToken();
                // Retry the request with the new access token...
            } else {
                // Handle other errors
            }
        }

        // Close cURL session
        curl_close($curl);

        // Decode the response and return it
        return json_decode($result, true);
    }

    /**
    * Update an order with the given parameters.
    * @param {string} orderID - The ID of the order to update.
    * @returns {Promise<object>} - The response from the PayPal API.
    */
    public function updateOrder($orderId, $patchData)
    {
        $curl = curl_init("{$this->baseUrl}/v2/checkout/orders/{$orderId}");
        $accessToken = $paypalAuthenticationService->getValidAccessToken();
        // Set the Authorization header with the access token
        $headers = [
            "Content-Type: application/json",
            "Authorization: Bearer {$this->accessToken}"
        ];

        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PATCH');
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($patchData));
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($curl);
        $statusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

        // Check for cURL errors
        if (curl_errno($curl)) {
            throw new Exception('Curl error: ' . curl_error($curl));
        }

        // Close cURL session
        curl_close($curl);

        // If the status code is 403, it might mean the access token has expired
        if ($statusCode == 403) {
            // Fallback logic to generate a new access token
            // This should call the method from the PayPalAuthenticationServices class to get a new token
            // $this->accessToken = (new PayPalAuthenticationServices())->getValidAccessToken();
            // Retry the update order operation with the new access token
            // $this->updateOrder($orderId, $patchData);
        } elseif ($statusCode != 204) {
            // Handle other errors
            throw new Exception("Failed to update order with Order ID: {$orderId}. Status code: {$statusCode}");
        }

        // If the status code is 204 (No Content), the update was successful
        return true;
    }

    public function captureOrder($response, $orderID)
    {
        $accessToken = $this->paypalAuthenticationService->authenticate();

        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, "{$this->baseUrl}/v2/checkout/orders/$orderID/capture");
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            "Content-Type: application/json",
            "Authorization: Bearer $accessToken"
        ]);

        $result = curl_exec($curl);
        $info = curl_getinfo($curl);
        if ($info['http_code'] != 201) {
            // Handle error
        }

        curl_close($curl);
        return $response->withJson(json_decode($result), 201);
    }

    public function getOrderDetails($response, $orderID)
    {
        $accessToken = $this->paypalAuthenticationService->authenticate();

        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, "{$this->baseUrl}/v2/checkout/orders/$orderID");
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $accessToken"
        ]);

        $result = curl_exec($curl);
        $info = curl_getinfo($curl);
        if ($info['http_code'] != 200) {
            // Handle error
        }

        curl_close($curl);
        return $response->withJson(json_decode($result), 200);
    }
}

?>