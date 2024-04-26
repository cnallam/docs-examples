<?php
use Slim\Http\Request;
use Slim\Http\Response;

// Assuming $app is an instance of \Slim\App
$app->post('/api/orders', function (Request $request, Response $response) {
    $paypalService = new PayPalOrderService();
    $body = $request->getParsedBody();
    $paymentAmount = $body['PaymentAmount'];
    $paymentType = $body['PaymentType'];
    $currencyCodeType = $body['currencyCodeType'];
    $returnURL = $body['returnURL'];
    $cancelURL = $body['cancelURL'];

    $order = $paypalService->createOrder($paymentAmount, $paymentType, $currencyCodeType, $returnURL, $cancelURL);
    return $response->withJson($order);
});

$app->get('/api/orders/{orderID}', function (Request $request, Response $response, $args) {
    $paypalService = new PayPalOrderService();
    $orderID = $args['orderID'];
    $orderDetails = $paypalService->getOrderDetails($response, $orderID);
    return $orderDetails;
});

$app->post('/api/orders/{orderID}/capture', function (Request $request, Response $response) {
    $paypalService = new PayPalOrderService();
    $orderID = $args['orderID'];

    $captureResponse = $paypalService->captureOrder($response, $orderID);
    return $captureResponse;
});


// Default Service
$app->get('/', function ($request, $response) {
    Redirect('../../client/checkout.html', false);
});

// Add other routes and logic as needed
require 'paypalorderservice.php';
require 'paypalauthenticationservice.php';

$app->run();

?>