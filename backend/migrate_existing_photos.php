<?php

require_once 'config.php';

// Получаем все авто с Telegram ссылками
$stmt = $pdo->query("SELECT id, image_path FROM vehicles WHERE image_path LIKE '%telegram.org%' OR image_path LIKE '%telesco.pe%'");
$cars = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($cars as $car) {
    echo "Обработка авто ID: {$car['id']}<br>";
    
    // Пытаемся скачать фото
    // Нужно получить file_id из старой ссылки или перезагрузить фото
    // Это сложнее, так как нужны оригинальные file_id
    
    echo "Авто ID {$car['id']} требует ручной обработки<br>";
}

echo "<h3>Для миграции существующих фото:</h3>";
echo "1. Найдите оригинальные фото в Telegram<br>";
echo "2. Отправьте их боту командой /addcar<br>";
echo "3. Введите данные авто заново<br>";
?>