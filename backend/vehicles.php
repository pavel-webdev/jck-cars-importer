<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
require_once 'config.php';

try {
    $stmt = $pdo->query("SELECT * FROM vehicles ORDER BY created_at DESC");
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'vehicles' => $vehicles
    ]);
} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка получения данных: ' . $e->getMessage()
    ]);
}
?>