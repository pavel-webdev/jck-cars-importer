<?php
require_once 'config.php';

function sendVerificationEmail($email, $name, $code) {
    $to = $email;
    $subject = "Подтверждение email - JCKCars";
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00d4ff, #0099ff, #ff0080); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .code { font-size: 32px; font-weight: bold; text-align: center; color: #00d4ff; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>JCKCars</h1>
                <p>Подтверждение email адреса</p>
            </div>
            <div class='content'>
                <p>Здравствуйте, <strong>$name</strong>!</p>
                <p>Для завершения регистрации на сайте JCKCars введите следующий код подтверждения:</p>
                <div class='code'>$code</div>
                <p>Код действителен в течение 15 минут.</p>
                <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
            </div>
            <div class='footer'>
                <p>© 2025 JCKCars. Все права защищены.</p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=utf-8\r\n";
    $headers .= "From: JCKCars <noreply@jckcars.ru>\r\n";
    $headers .= "Reply-To: manager@jckcars.ru\r\n";
    
    return mail($to, $subject, $message, $headers);
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST["email"]);
    $name = trim($_POST["name"]);
    
    // Проверяем, есть ли уже пользователь с таким email
    $checkStmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $checkStmt->execute([$email]);
    $existingUser = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingUser) {
        if ($existingUser['email_verified']) {
            echo json_encode(["success" => false, "message" => "Пользователь с таким email уже зарегистрирован"]);
            exit;
        } else {
            // Если email не подтвержден, обновляем данные
            $code = sprintf("%06d", mt_rand(1, 999999));
            $expires = date("Y-m-d H:i:s", strtotime("+15 minutes"));
            
            $updateStmt = $pdo->prepare("UPDATE users SET name = ?, verification_code = ?, code_expires = ? WHERE email = ?");
            $updateStmt->execute([$name, $code, $expires, $email]);
        }
    } else {
        // Новый пользователь
        $code = sprintf("%06d", mt_rand(1, 999999));
        $expires = date("Y-m-d H:i:s", strtotime("+15 minutes"));
        
        $stmt = $pdo->prepare("INSERT INTO users (name, email, verification_code, code_expires, email_verified) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $code, $expires, false]);
    }
    
    // Отправляем email
    if (sendVerificationEmail($email, $name, $code)) {
        echo json_encode(["success" => true, "message" => "Код подтверждения отправлен на ваш email"]);
    } else {
        echo json_encode(["success" => false, "message" => "Ошибка отправки email. Проверьте настройки почты."]);
    }
}
?>