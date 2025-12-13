<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Comprobante #{{ $sale->id }}</title>
    <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; max-width: 80mm; margin: 0 auto; padding: 10px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .table { width: 100%; margin-top: 10px; border-collapse: collapse; }
        .table th { border-bottom: 1px dashed #000; text-align: left; }
        .table td { padding: 4px 0; }
        .total { font-size: 16px; border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; }
        .sello { border: 2px solid #000; padding: 5px; margin: 10px 0; font-weight: bold; font-size: 10px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body onload="window.print()">
    <div class="center bold">REPUESTOS KM21</div>
    <div class="center">Av. Principal 1234, Ciudad</div>
    <div class="center">Tel: (011) 1234-5678</div>
    <hr>
    
    <div class="center sello">
        DOCUMENTO NO VÁLIDO COMO FACTURA<br>
        COMPROBANTE INTERNO
    </div>

    <div>Fecha: {{ $sale->fecha->format('d/m/Y H:i') }}</div>
    <div>Comp: #{{ str_pad($sale->id, 8, '0', STR_PAD_LEFT) }}</div>
    <div>Cliente: {{ $sale->customer ? $sale->customer->nombre : 'Consumidor Final' }}</div>

    <table class="table">
        <thead>
            <tr>
                <th>Prod</th>
                <th>Cant</th>
                <th style="text-align:right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sale->items as $item)
            <tr>
                <td>{{ \Illuminate\Support\Str::limit($item->producto_nombre, 15) }}<br><small>{{ $item->marca_nombre }}</small></td>
                <td>{{ $item->cantidad }}</td>
                <td style="text-align:right">${{ number_format($item->subtotal, 0) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total center bold">
        TOTAL: ${{ number_format($sale->total_final, 2) }}
    </div>
    
    <div class="center" style="margin-top:20px; font-size:10px;">
        Gracias por su compra.<br>
        Conservar este ticket para cambios.<br>
        (Plazo máximo: 15 días)
    </div>

    <button class="no-print" onclick="window.print()" style="width:100%; padding:10px; margin-top:20px; font-size:14px; cursor: pointer; background: #eee; border: 1px solid #ccc;">IMPRIMIR</button>
</body>
</html>
