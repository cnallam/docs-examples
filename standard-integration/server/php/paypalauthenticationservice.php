/*
1. Reading environment variables for PayPal credentials and the base URL.
2. The `authenticate` method to obtain a new access token from PayPal.
3. A background process (`startTokenValidityCheck`) that checks the token's validity every minute.
4. The `checkTokenValidity` method to determine if the token needs to be refreshed.
5. The `getValidAccessToken` method to retrieve a valid access token for use in API calls.

Please note that the background process implemented with `startTokenValidityCheck` and `checkTokenValidity` is a conceptual representation. 
In a production environment, you would use a proper task scheduler or cron job to handle token refreshes, rather than an infinite loop with `sleep`. 
Additionally, the access token should be stored in a secure cache or storage mechanism, rather than in a class property, to ensure it persists across different requests and can be accessed by parallel processes.
 */

<?php
class PayPalAuthenticationService
{
    private $clientId;
    private $secret;
    private $baseUrl;
    private $accessToken;
    private $tokenExpiresIn;

    public function __construct()
    {
        // Read environment variables for PayPal credentials and base URL
        $this->clientId = getenv('PAYPAL_CLIENT_ID');
        $this->secret = getenv('PAYPAL_CLIENT_SECRET');
        $this->baseUrl = getenv('BASE_URL');
        
        // Start the background process to check token validity
        $this->startTokenValidityCheck();
    }

    private function authenticate()
    {
        // Initialize cURL session
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, "{$this->baseUrl}/v1/oauth2/token");
        curl_setopt($curl, CURLOPT_HEADER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); 
        curl_setopt($curl, CURLOPT_USERPWD, $this->clientId . ":" . $this->secret);
        curl_setopt($curl, CURLOPT_POSTFIELDS, "grant_type=client_credentials");

        // Execute cURL request
        $response = curl_exec($curl);
        $info = curl_getinfo($curl);
        if ($info['http_code'] != 200) {
            // Handle error
            throw new Exception('Failed to retrieve access token from PayPal');
        }

        // Close cURL session
        curl_close($curl);
        $jsonResponse = json_decode($response, true);
        
        // Store access token and expiry duration
        $this->accessToken = $jsonResponse['access_token'];
        $this->tokenExpiresIn = $jsonResponse['expires_in'];
    }

    private function startTokenValidityCheck()
    {
        // Start a background thread or process to check the validity of the access token every minute
        while (true) {
            sleep(60); // Wait for a minute before the next check
            $this->checkTokenValidity();
        }
    }

    private function checkTokenValidity()
    {
        // If the access token validity is less than 2 minutes, refresh the token
        if ($this->tokenExpiresIn < 120) {
            $this->authenticate();
        }
    }

    public function getValidAccessToken()
    {
        // If there's no access token or it's about to expire, authenticate again
        if (empty($this->accessToken) || $this->tokenExpiresIn < 120) {
            $this->authenticate();
        }
        return $this->accessToken;
    }
}

// Export the method getValidAccessToken
// $paypalAuth = new PayPalAuthenticationServices();
// $accessToken = $paypalAuth->getValidAccessToken();
// Use $accessToken for further API calls
?>