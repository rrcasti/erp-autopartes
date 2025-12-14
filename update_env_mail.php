<?php
$path = '.env';
if (!file_exists($path)) {
    echo ".env not found";
    exit(1);
}
$content = file_get_contents($path);

// Bloque de configuración deseada
$updates = [
    'MAIL_MAILER' => 'smtp',
    'MAIL_HOST' => 'smtp.gmail.com',
    'MAIL_PORT' => '587',
    'MAIL_USERNAME' => 'raul32castillo@gmail.com',
    'MAIL_PASSWORD' => 'PEGAR_AQUI_TU_CLAVE',
    'MAIL_ENCRYPTION' => 'tls',
    'MAIL_FROM_ADDRESS' => '"raul32castillo@gmail.com"',
    'MAIL_FROM_NAME' => '"Repuestos KM21"'
];

foreach ($updates as $key => $value) {
    // Si existe la clave, la reemplazamos
    if (preg_match("/^{$key}=.*/m", $content, $matches)) {
        $content = preg_replace("/^{$key}=.*/m", "{$key}={$value}", $content);
    } else {
        // Si no existe, podría agregarla, pero las estándar de mail suelen estar.
        // La agregamos al final por si acaso
        $content .= "\n{$key}={$value}";
    }
}

// Reemplazar MAIL_FROM_NAME="${APP_NAME}" especificamente si existe así
$content = str_replace('MAIL_FROM_NAME="${APP_NAME}"', 'MAIL_FROM_NAME="Repuestos KM21"', $content);

file_put_contents($path, $content);
echo "ENV Updated Successfully with Gmail settings.";
