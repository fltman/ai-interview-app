<?php
/**
 * OpenAI Realtime API Proxy
 * Forwards WebRTC SDP offers to OpenAI to avoid CORS restrictions
 */

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Get Authorization header (multiple methods for different server configs)
$authHeader = '';

// Method 1: getallheaders()
if (function_exists('getallheaders')) {
    $headers = getallheaders();
    // Try different cases
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $authHeader = $value;
            break;
        }
    }
}

// Method 2: Apache mod_rewrite passes it as HTTP_AUTHORIZATION
if (empty($authHeader) && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
}

// Method 3: Some servers use REDIRECT_HTTP_AUTHORIZATION
if (empty($authHeader) && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
}

// Method 4: PHP-CGI workaround
if (empty($authHeader)) {
    $authStr = $_SERVER['Authorization'] ??
               $_SERVER['HTTP_AUTHORIZATION'] ??
               $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!empty($authStr)) {
        $authHeader = $authStr;
    }
}

// Method 5: Custom header X-API-Key as fallback
if (empty($authHeader) && !empty($_SERVER['HTTP_X_API_KEY'])) {
    $authHeader = 'Bearer ' . $_SERVER['HTTP_X_API_KEY'];
}

// Debug: Return available headers if auth fails
if (empty($authHeader)) {
    http_response_code(401);
    header('Content-Type: application/json');

    // Get all available headers for debugging
    $debugHeaders = [];
    if (function_exists('getallheaders')) {
        $debugHeaders['getallheaders'] = array_keys(getallheaders());
    }
    $debugHeaders['SERVER_keys'] = array_filter(array_keys($_SERVER), function($k) {
        return strpos($k, 'HTTP_') === 0 || strpos($k, 'AUTH') !== false;
    });

    echo json_encode([
        'error' => 'Authorization header not found',
        'debug' => $debugHeaders,
        'hint' => 'Add to .htaccess: SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1'
    ]);
    exit;
}

// Get model from query string
$model = $_GET['model'] ?? 'gpt-realtime';

// Get request body (SDP)
$sdp = file_get_contents('php://input');

if (empty($sdp)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'SDP body required']);
    exit;
}

// Forward to OpenAI
$url = 'https://api.openai.com/v1/realtime?model=' . urlencode($model);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $sdp,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: ' . $authHeader,
        'Content-Type: application/sdp',
    ],
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error: ' . $error]);
    exit;
}

// If OpenAI returns an error, pass it through with more info
if ($httpCode >= 400) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'OpenAI API error',
        'status' => $httpCode,
        'response' => $response,
        'model' => $model
    ]);
    exit;
}

// Return OpenAI's SDP response
http_response_code($httpCode);
header('Content-Type: application/sdp');
echo $response;
