<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST["email"]);
    $code = trim($_POST["code"]);
    $password = $_POST["password"];
    
    try {
        // Проверяем код и время
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND verification_code = ? AND code_expires > NOW()");
        $stmt->execute([$email, $code]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Хешируем пароль и активируем аккаунт
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            $updateStmt = $pdo->prepare("UPDATE users SET password = ?, email_verified = TRUE, verification_code = NULL, code_expires = NULL WHERE email = ?");
            $updateStmt->execute([$hashedPassword, $email]);
            
            // Получаем обновленные данные пользователя
            $userStmt = $pdo->prepare("SELECT id, name, email FROM users WHERE email = ?");
            $userStmt->execute([$email]);
            $verifiedUser = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Email успешно подтвержден!',
                'user' => [
                    'id' => $verifiedUser['id'],
                    'name' => $verifiedUser['name'],
                    'email' => $verifiedUser['email']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Неверный код или время истекло']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
    }
}
?>