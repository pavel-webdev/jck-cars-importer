<?php
require_once 'config.php';

$bot_token = '***';
$webhook_url = 'https://';

// Установка вебхука
if (isset($_GET['set_webhook'])) {
    $url = "https://api.telegram.org/bot{$bot_token}/setWebhook?url={$webhook_url}";
    $result = file_get_contents($url);
    echo "Webhook set: " . $result;
    exit;
}

// Получаем входящее сообщение
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    exit;
}

$message = $data['message'] ?? $data['channel_post'] ?? null;
if (!$message) {
    exit;
}

$chat_id = $message['chat']['id'];
$chat_type = $message['chat']['type'];
$text = $message['text'] ?? '';
$photo = $message['photo'] ?? null;

// Разрешенные чаты
$allowed_chat_ids = [
               
];

if (!in_array($chat_id, $allowed_chat_ids)) {
    sendMessage($chat_id, "❌ У вас нет доступа к этому боту");
    exit;
}

// Обработка команд
if ($text === '/start' || strpos($text, '/start@') === 0) {
    sendMessage($chat_id, "🚗 Добро пожаловать в JCK Cars Importer!\n\nКоманды:\n/addcar - Добавить авто\n/listcars - Список авто\n/cancel - Отменить добавление");
}

if ($text === '/cancel' || strpos($text, '/cancel@') === 0) {
    cancelCarAddition($chat_id);
}

if ($text === '/addcar' || strpos($text, '/addcar@') === 0) {
    startCarAddition($chat_id);
}

if ($text === '/listcars' || strpos($text, '/listcars@') === 0) {
    showLastCars($chat_id);
}

// Обработка пошагового ввода
$temp_data = getTempData($chat_id);
if ($temp_data && $temp_data['step'] > 0) {
    processStep($chat_id, $text, $photo, $temp_data);
}

// === ОСНОВНЫЕ ФУНКЦИИ ===

function startCarAddition($chat_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM car_temp_data WHERE chat_id = ?");
    $stmt->execute([$chat_id]);
    
    $stmt = $pdo->prepare("INSERT INTO car_temp_data (chat_id, step) VALUES (?, 1)");
    $stmt->execute([$chat_id]);
    
    $keyboard = [
        'keyboard' => [
            [['text' => '🇯🇵 Япония (JPY)']],
            [['text' => '🇨🇳 Китай (CNY)']],
            [['text' => '❌ Отменить']]
        ],
        'resize_keyboard' => true,
        'one_time_keyboard' => true
    ];
    
    sendMessage($chat_id, "🌍 <b>ШАГ 1: Выберите страну происхождения</b>\n\nЭтап определит валюту и расчеты для авто", $keyboard);
}

function cancelCarAddition($chat_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("DELETE FROM car_temp_data WHERE chat_id = ?");
    $stmt->execute([$chat_id]);
    
    sendMessage($chat_id, "❌ Добавление авто отменено", null, true);
}

function getTempData($chat_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("SELECT * FROM car_temp_data WHERE chat_id = ?");
    $stmt->execute([$chat_id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function updateTempData($chat_id, $data) {
    global $pdo;
    
    $fields = [];
    $values = [];
    
    foreach ($data as $field => $value) {
        $fields[] = "{$field} = ?";
        $values[] = $value;
    }
    
    $values[] = $chat_id;
    
    $sql = "UPDATE car_temp_data SET " . implode(', ', $fields) . " WHERE chat_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
}

function processStep($chat_id, $text, $photo, $temp_data) {
    $step = $temp_data['step'];
    
    // Обработка отмены
    if ($text === '❌ Отменить') {
        cancelCarAddition($chat_id);
        return;
    }
    
    // Редактирование предыдущих шагов
    if (strpos($text, '/edit') === 0) {
        handleEditCommand($chat_id, $text, $temp_data);
        return;
    }
    
    switch ($step) {
        case 1: // Выбор страны
            if ($text === '🇯🇵 Япония (JPY)') {
                $update_data = [
                    'country' => 'Japan',
                    'currency' => 'JPY',
                    'currency_symbol' => '¥',
                    'step' => 2
                ];
                updateTempData($chat_id, $update_data);
                showStepWithEdit($chat_id, 2, $update_data);
            } elseif ($text === '🇨🇳 Китай (CNY)') {
                $update_data = [
                    'country' => 'China',
                    'currency' => 'CNY', 
                    'currency_symbol' => '¥',
                    'step' => 2
                ];
                updateTempData($chat_id, $update_data);
                showStepWithEdit($chat_id, 2, $update_data);
            } else {
                sendMessage($chat_id, "❌ Пожалуйста, выберите страну из предложенных вариантов");
            }
            break;
            
        case 2: // Марка
            $update_data = [
                'brand' => $text,
                'step' => 3
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 3, $update_data);
            break;
            
        case 3: // Модель
            $update_data = [
                'model' => $text,
                'step' => 4
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 4, $update_data);
            break;
            
        case 4: // Название
            $update_data = [
                'title' => $text,
                'step' => 5
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 5, $update_data);
            break;
            
        case 5: // Год
            if (!is_numeric($text) || $text < 1990 || $text > 2030) {
                sendMessage($chat_id, "❌ Введите корректный год (1990-2030)");
                return;
            }
            $update_data = [
                'year' => (int)$text,
                'step' => 6
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 6, $update_data);
            break;
            
        case 6: // Цена
            if (!is_numeric($text) || $text <= 0) {
                sendMessage($chat_id, "❌ Введите корректную цену (только цифры)");
                return;
            }
            $update_data = [
                'price' => (float)$text,
                'step' => 7
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 7, $update_data);
            break;
            
        case 7: // Двигатель
            if (!is_numeric($text) || $text <= 0) {
                sendMessage($chat_id, "❌ Введите корректный объем двигателя");
                return;
            }
            $update_data = [
                'engine' => (float)$text,
                'step' => 8
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 8, $update_data);
            break;
            
        case 8: // Мощность (л.с.)
            if (!is_numeric($text) || $text <= 0) {
                sendMessage($chat_id, "❌ Введите корректную мощность");
                return;
            }
            $update_data = [
                'horsepower' => (int)$text,
                'step' => 9
            ];
            updateTempData($chat_id, $update_data);
            showStepWithEdit($chat_id, 9, $update_data);
            break;
            
        case 9: // Пробег (км)
            if (!is_numeric($text) || $text < 0) {
                sendMessage($chat_id, "❌ Введите корректный пробег");
                return;
            }
            $update_data = [
                'mileage' => (int)$text,
                'step' => 10
            ];
            updateTempData($chat_id, $update_data);
            
            $temp_data = getTempData($chat_id);
            $summary = getCarSummary($temp_data);
            
            $keyboard = [
                'keyboard' => [
                    [['text' => '📸 Добавить фото']],
                    [['text' => '✅ Завершить без фото']],
                    [['text' => '✏️ Редактировать данные']],
                    [['text' => '❌ Отменить']]
                ],
                'resize_keyboard' => true,
                'one_time_keyboard' => true
            ];
            
            sendMessage($chat_id, "📸 <b>ШАГ 10: Добавление фотографий</b>\n\n{$summary}\n\n📷 Можно добавить несколько фото. Первое фото будет главным.", $keyboard);
            break;
            
        case 10: // Фото - меню
            if ($text === '✅ Завершить без фото') {
                $temp_data = getTempData($chat_id);
                saveCarToDatabase($chat_id, $temp_data);
            } elseif ($text === '📸 Добавить фото') {
                $update_data = ['step' => 11];
                updateTempData($chat_id, $update_data);
                sendMessage($chat_id, "📷 Отправьте фотографии автомобиля\n\nМожно отправить несколько фото подряд.\nКогда закончите, отправьте команду /done", null, true);
            } elseif ($text === '✏️ Редактировать данные') {
                showEditMenu($chat_id, $temp_data);
            } else {
                sendMessage($chat_id, "❌ Пожалуйста, выберите действие из меню");
            }
            break;
            
        case 11: // Прием фото
            if ($text === '/done') {
                $temp_data = getTempData($chat_id);
                if (empty($temp_data['photos_json'])) {
                    sendMessage($chat_id, "❌ Вы не добавили ни одного фото. Добавьте фото или завершите без фото.");
                    return;
                }
                saveCarToDatabase($chat_id, $temp_data);
            } elseif ($photo) {
                // Получаем file_id самого большого фото
                $largest_photo = end($photo);
                $file_id = $largest_photo['file_id'];
                
                // Сохраняем file_id во временные данные
                $current_photos = [];
                if (!empty($temp_data['photos_json'])) {
                    $current_photos = json_decode($temp_data['photos_json'], true);
                }
                
                $current_photos[] = $file_id; // Сохраняем file_id вместо URL
                
                $update_data = [
                    'photos_json' => json_encode($current_photos),
                    'step' => 11 // Остаемся на том же шаге
                ];
                updateTempData($chat_id, $update_data);
                
                $count = count($current_photos);
                sendMessage($chat_id, "✅ Добавлено фото {$count}\nОтправьте еще фото или /done для завершения");
            } else {
                sendMessage($chat_id, "📷 Отправьте фото или /done для завершения");
            }
            break;
    }
}

function showStepWithEdit($chat_id, $step, $data) {
    $messages = [
        2 => "🏷️ <b>ШАГ 2: Введите марку автомобиля</b>\n\nСтрана: <b>{$data['country']}</b>\nВалюта: <b>{$data['currency']}</b>\n\nПример: Toyota\n\n<code>/edit1</code> - изменить страну",
        3 => "🚙 <b>ШАГ 3: Введите модель автомобиля</b>\n\nМарка: <b>{$data['brand']}</b>\n\nПример: Camry\n\n<code>/edit2</code> - изменить марку",
        4 => "📝 <b>ШАГ 4: Введите полное название</b>\n\nМодель: <b>{$data['model']}</b>\n\nПример: Toyota Camry Hybrid 2023\n\n<code>/edit3</code> - изменить модель",
        5 => "📅 <b>ШАГ 5: Введите год выпуска</b>\n\nНазвание: <b>{$data['title']}</b>\n\nПример: 2023\n\n<code>/edit4</code> - изменить название",
        6 => "💰 <b>ШАГ 6: Введите цену в {$data['currency']}</b>\n\nГод: <b>{$data['year']}</b>\n\nПример: 2850000\n\n<code>/edit5</code> - изменить год",
        7 => "⚙️ <b>ШАГ 7: Введите объем двигателя (л)</b>\n\nЦена: <b>{$data['currency_symbol']} " . number_format($data['price']) . "</b>\n\nПример: 2.5\n\n<code>/edit6</code> - изменить цену",
        8 => "🐎 <b>ШАГ 8: Введите мощность (л.с.)</b>\n\nДвигатель: <b>{$data['engine']} л</b>\n\nПример: 150\n\n<code>/edit7</code> - изменить объем двигателя",
        9 => "🛣️ <b>ШАГ 9: Введите пробег (км)</b>\n\nМощность: <b>{$data['horsepower']} л.с.</b>\n\nПример: 20000\n\n<code>/edit8</code> - изменить мощность"
    ];
    
    sendMessage($chat_id, $messages[$step], null, true);
}

function handleEditCommand($chat_id, $text, $temp_data) {
    $edit_step = (int)str_replace('/edit', '', $text);
    
    if ($edit_step >= 1 && $edit_step <= 8) {
        $update_data = ['step' => $edit_step];
        updateTempData($chat_id, $update_data);
        
        // Показываем соответствующий шаг для редактирования
        showStepWithEdit($chat_id, $edit_step, $temp_data);
    } else {
        sendMessage($chat_id, "❌ Неверная команда редактирования");
    }
}

function showEditMenu($chat_id, $temp_data) {
    $summary = getCarSummary($temp_data);
    
    $message = "✏️ <b>Редактирование данных</b>\n\n{$summary}\n\n";
    $message .= "Выберите что изменить:\n";
    $message .= "<code>/edit1</code> - Страна\n";
    $message .= "<code>/edit2</code> - Марка\n";
    $message .= "<code>/edit3</code> - Модель\n";
    $message .= "<code>/edit4</code> - Название\n";
    $message .= "<code>/edit5</code> - Год\n";
    $message .= "<code>/edit6</code> - Цена\n";
    $message .= "<code>/edit7</code> - Двигатель\n";
    $message .= "<code>/edit8</code> - Мощность\n";
    $message .= "<code>/edit9</code> - Пробег\n\n";
    $message .= "Или продолжайте добавление фото";
    
    sendMessage($chat_id, $message);
}

function getCarSummary($data) {
    $summary = "📋 <b>Сводка данных:</b>\n";
    $summary .= "🌍 <b>Страна:</b> {$data['country']}\n";
    $summary .= "🏷️ <b>Марка:</b> {$data['brand']}\n";
    $summary .= "🚙 <b>Модель:</b> {$data['model']}\n";
    $summary .= "📝 <b>Название:</b> {$data['title']}\n";
    $summary .= "📅 <b>Год:</b> {$data['year']}\n";
    $summary .= "💰 <b>Цена:</b> {$data['currency_symbol']} " . number_format($data['price']) . "\n";
    $summary .= "⚙️ <b>Двигатель:</b> {$data['engine']} л\n";
    $summary .= "🐎 <b>Мощность:</b> {$data['horsepower']} л.с.\n";
    $summary .= "🛣️ <b>Пробег:</b> " . number_format($data['mileage']) . " км\n";
    
    if (!empty($data['photos_json'])) {
        $photos = json_decode($data['photos_json'], true);
        $summary .= "📸 <b>Фото:</b> " . count($photos) . " шт.\n";
    }
    
    return $summary;
}

// ==================== ФУНКЦИЯ СКАЧИВАНИЯ ФОТО ====================
function downloadTelegramPhoto($file_id, $car_id, $index = 0) {
    global $bot_token;
    
    // Получаем информацию о файле
    $file_url = "https://api.telegram.org/bot{$bot_token}/getFile?file_id={$file_id}";
    $response = @file_get_contents($file_url);
    
    if (!$response) {
        error_log("Не удалось получить информацию о файле: {$file_id}");
        return null;
    }
    
    $file_info = json_decode($response, true);
    
    if (!$file_info['ok']) {
        error_log("Ошибка получения файла: " . json_encode($file_info));
        return null;
    }
    
    $file_path = $file_info['result']['file_path'];
    
    // Определяем расширение
    $extension = pathinfo($file_path, PATHINFO_EXTENSION);
    if (empty($extension)) {
        $extension = 'jpg';
    }
    
    // Генерируем уникальное имя файла
    $timestamp = time();
    $random = rand(1000, 9999);
    $filename = "car_{$car_id}_{$timestamp}_{$random}_{$index}.{$extension}";
    
    // Папка для сохранения
    $directory = $_SERVER['DOCUMENT_ROOT'] . "/assets/images/vehicles/";
    
    // Создаем папку если нет
    if (!is_dir($directory)) {
        mkdir($directory, 0755, true);
    }
    
    $save_path = $directory . $filename;
    
    // URL для скачивания файла
    $download_url = "https://api.telegram.org/file/bot{$bot_token}/{$file_path}";
    
    // Скачиваем файл
    $photo_data = @file_get_contents($download_url);
    
    if ($photo_data === false) {
        error_log("Не удалось скачать файл: {$download_url}");
        return null;
    }
    
    // Сохраняем файл
    $result = file_put_contents($save_path, $photo_data);
    
    if ($result === false) {
        error_log("Не удалось сохранить файл: {$save_path}");
        return null;
    }
    
    // Проверяем что файл сохранен
    if (!file_exists($save_path) || filesize($save_path) == 0) {
        error_log("Файл сохранен пустым: {$save_path}");
        return null;
    }
    
    // Возвращаем относительный путь
    return "/assets/images/vehicles/{$filename}";
}

// ==================== ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ====================
function saveCarToDatabase($chat_id, $data) {
    global $pdo;
    
    try {
        // Создаем запись в БД
        $stmt = $pdo->prepare("INSERT INTO vehicles (title, brand, model, year, price, engine, country, currency, horsepower, mileage, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $data['title'],
            $data['brand'], 
            $data['model'],
            $data['year'],
            $data['price'],
            $data['engine'],
            $data['country'],
            $data['currency'],
            $data['horsepower'] ?? 0,
            $data['mileage'] ?? 0
        ]);
        
        $car_id = $pdo->lastInsertId();
        
        // Обрабатываем фото если они есть
        $image_path = '';
        $images_json = '[]';
        
        if (!empty($data['photos_json'])) {
            $file_ids = json_decode($data['photos_json'], true);
            $downloaded_paths = [];
            
            foreach ($file_ids as $index => $file_id) {
                $local_path = downloadTelegramPhoto($file_id, $car_id, $index);
                
                if ($local_path) {
                    $downloaded_paths[] = $local_path;
                    
                    // Первое фото - главное
                    if ($index === 0) {
                        $image_path = $local_path;
                    }
                } else {
                    error_log("Не удалось скачать фото {$file_id} для авто {$car_id}");
                }
            }
            
            $images_json = json_encode($downloaded_paths);
            
            // Если не удалось скачать главное фото, но есть другие фото
            if (empty($image_path) && !empty($downloaded_paths)) {
                $image_path = $downloaded_paths[0];
            }
        }
        
        // Обновляем запись с путями к фото
        if (!empty($image_path) || !empty($images_json)) {
            $stmt = $pdo->prepare("UPDATE vehicles SET image_path = ?, images_json = ? WHERE id = ?");
            $stmt->execute([
                $image_path ?: '',
                $images_json,
                $car_id
            ]);
        }
        
        // Формируем итоговое сообщение
        $summary = getCarSummary($data);
        $message = "✅ <b>Авто успешно добавлено в базу!</b>\n\n{$summary}\n🆔 <b>ID в базе:</b> {$car_id}\n";
        
        if (!empty($image_path)) {
            $message .= "📸 <b>Фото загружены на сервер</b> (" . count(json_decode($images_json, true) ?: []) . " шт.)\n";
        } else {
            $message .= "📸 <b>Фото не добавлены</b>\n";
        }
        
        $message .= "\n💡 <i>Авто появится в каталоге на сайте через несколько секунд</i>";
        
        sendMessage($chat_id, $message, null, true);
        
        // Очищаем временные данные
        cancelCarAddition($chat_id);
        
    } catch(PDOException $e) {
        error_log("DB Error in saveCarToDatabase: " . $e->getMessage());
        sendMessage($chat_id, "❌ Ошибка базы данных: " . $e->getMessage());
    }
}

function sendMessage($chat_id, $text, $keyboard = null, $remove_keyboard = false) {
    global $bot_token;
    
    $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
    $data = [
        'chat_id' => $chat_id,
        'text' => $text,
        'parse_mode' => 'HTML'
    ];
    
    if ($keyboard) {
        $data['reply_markup'] = json_encode($keyboard);
    } elseif ($remove_keyboard) {
        $data['reply_markup'] = json_encode(['remove_keyboard' => true]);
    }
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    @file_get_contents($url, false, $context);
}

function showLastCars($chat_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->query("SELECT * FROM vehicles ORDER BY id DESC LIMIT 5");
        $cars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($cars)) {
            sendMessage($chat_id, "📭 В базе пока нет автомобилей");
            return;
        }
        
        $message = "📋 <b>Последние 5 авто в базе:</b>\n\n";
        
        foreach ($cars as $car) {
            $currency_symbol = $car['currency'] === 'JPY' ? '¥' : ($car['currency'] === 'CNY' ? '¥' : '₩');
            $country_flag = $car['country'] === 'Japan' ? '🇯🇵' : ($car['country'] === 'China' ? '🇨🇳' : '🇰🇷');
            
            $message .= "{$country_flag} <b>{$car['title']}</b>\n";
            $message .= "💰 {$currency_symbol}" . number_format($car['price']) . " • {$car['year']} • {$car['engine']}L\n";
            $message .= "🌍 {$car['country']} • ID: {$car['id']}\n";
            
            if ($car['image_path']) {
                $message .= "📸 Фото: есть\n";
            } else {
                $message .= "📸 Фото: нет\n";
            }
            
            $message .= "────────────────────\n";
        }
        
        $total_stmt = $pdo->query("SELECT COUNT(*) as total FROM vehicles");
        $total = $total_stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $message .= "\n📊 Всего авто в базе: <b>{$total}</b>";
        
        sendMessage($chat_id, $message);
        
    } catch(PDOException $e) {
        error_log("DB Error in showLastCars: " . $e->getMessage());
        sendMessage($chat_id, "❌ Ошибка базы данных: " . $e->getMessage());
    }
}

// Автоматическая очистка старых временных данных
function cleanupTempData() {
    global $pdo;
    try {
        $stmt = $pdo->prepare("DELETE FROM car_temp_data WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
        $stmt->execute();
    } catch(PDOException $e) {
        error_log("Cleanup error: " . $e->getMessage());
    }
}

// Выполняем очистку при каждом запросе (можно сделать по крону)
cleanupTempData();

// Логирование для отладки
$log_data = [
    'timestamp' => date('Y-m-d H:i:s'),
    'chat_id' => $chat_id,
    'text' => $text,
    'has_photo' => !empty($photo)
];
file_put_contents($_SERVER['DOCUMENT_ROOT'] . '/telegram_bot.log', json_encode($log_data) . PHP_EOL, FILE_APPEND);
?>