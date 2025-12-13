<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>RepuestosKm21 ERP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    {{-- IMPORTANTE: meta CSRF para los fetch del ERP --}}
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @viteReactRefresh
    @vite('resources/js/erp/main.jsx')
</head>
<body class="antialiased bg-gray-900 text-gray-100">
    <div id="erp-root"></div>
</body>
</html>
