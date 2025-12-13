<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * De momento lo dejamos vacío. NO excluimos las rutas del ERP
     * porque ya estamos enviando el token desde React.
     *
     * @var array<int, string>
     */
    protected $except = [
        //
    ];
}
