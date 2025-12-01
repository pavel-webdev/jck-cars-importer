<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $password = password_hash($_POST['pass'], PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $password]);
        
        echo json_encode(['success' => true, 'message' => 'Регистрация успешна!']);
    } catch(PDOException $e) {
        if ($e->getCode() == 23000) { // duplicate entry
            echo json_encode(['success' => false, 'message' => 'Пользователь с таким email уже существует']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
        }
    }
}
?>