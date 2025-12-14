<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cierre de Caja #{{ $cashRegister->id }}</title>
    <style>
        body { font-family: sans-serif; font-size: 14px; line-height: 1.4; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 24px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #666; }
        .box-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        .card { border: 1px solid #ddd; padding: 10px; border-radius: 4px; background: #f9f9f9; }
        .card-title { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 4px; font-weight: bold; }
        .card-value { font-size: 18px; font-weight: bold; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ddd; margin-top: 30px; margin-bottom: 10px; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border-bottom: 1px solid #eee; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .income { color: green; }
        .expense { color: red; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body onload="window.print()">

    <div class="header">
        <h1>Reporte de Cierre de Caja</h1>
        <p>REPUESOS KM21 ERP</p>
    </div>

    <div class="meta">
        <div>
            <strong>Caja #:</strong> {{ $cashRegister->id }}<br>
            <strong>Cajero:</strong> {{ $cashRegister->user->name }}
        </div>
        <div class="text-right">
            <strong>Apertura:</strong> {{ $cashRegister->opened_at->format('d/m/Y H:i') }}<br>
            <strong>Cierre:</strong> {{ $cashRegister->closed_at ? $cashRegister->closed_at->format('d/m/Y H:i') : 'Pendiente' }}
        </div>
    </div>

    <div class="box-summary">
        <div class="card">
            <div class="card-title">Saldo Inicial</div>
            <div class="card-value">${{ number_format($cashRegister->start_balance, 2) }}</div>
        </div>
        <div class="card">
            <div class="card-title">Saldo Final (Teórico)</div>
            <div class="card-value">${{ number_format($totals['expected_end'], 2) }}</div>
        </div>
        <div class="card">
            <div class="card-title">Ingresos Totales</div>
            <div class="card-value income">+${{ number_format($totals['income'], 2) }}</div>
        </div>
        <div class="card">
            <div class="card-title">Egresos Totales</div>
            <div class="card-value expense">-${{ number_format($totals['expense'], 2) }}</div>
        </div>
    </div>

    @if($cashRegister->status === 'closed')
    <div class="box-summary">
        <div class="card" style="background: #fff; border-color: #333;">
            <div class="card-title">Saldo Real (Arqueo)</div>
            <div class="card-value">${{ number_format($cashRegister->real_balance, 2) }}</div>
        </div>
        <div class="card" style="background: {{ $difference == 0 ? '#eaffea' : '#fff0f0' }}">
            <div class="card-title">Diferencia</div>
            <div class="card-value {{ $difference >= 0 ? 'income' : 'expense' }}">
                {{ $difference > 0 ? '+' : '' }}${{ number_format($difference, 2) }}
            </div>
        </div>
    </div>
    @endif

    <div class="section-title">Movimientos Registrados</div>
    <table>
        <thead>
            <tr>
                <th width="15%">Hora</th>
                <th width="10%">Tipo</th>
                <th width="40%">Descripción / Venta</th>
                <th width="15%">Método</th>
                <th width="20%" class="text-right">Monto</th>
            </tr>
        </thead>
        <tbody>
            @forelse($cashRegister->movements as $mov)
            <tr>
                <td>{{ $mov->created_at->format('H:i') }}</td>
                <td>
                    <span class="{{ $mov->type == 'income' ? 'income' : 'expense' }}">
                        {{ $mov->type == 'income' ? 'Ingreso' : 'Egreso' }}
                    </span>
                </td>
                <td>
                    {{ $mov->description }}
                    @if($mov->sale_id) <small>(Ref: #{{ $mov->sale_id }})</small> @endif
                </td>
                <td>{{ ucfirst($mov->payment_method) }}</td>
                <td class="text-right">
                    ${{ number_format($mov->amount, 2) }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center">Sin movimientos</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; font-size: 11px; color: #999;">
        Generado por Sistema ERP el {{ now()->format('d/m/Y H:i:s') }}
    </div>

</body>
</html>
