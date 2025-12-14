<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .header { background: #f3f4f6; padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .header h1 { margin: 0; font-size: 20px; color: #111827; }
        .content { padding: 20px; background: #ffffff; }
        .message-box { background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 20px; border-radius: 4px; font-size: 14px; }
        .table-container { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        th { background-color: #f9fafb; text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: #6b7280; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; }
        tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Orden de Compra <span style="color: #4f46e5;">{{ $po->po_number }}</span></h1>
            <p style="margin: 5px 0 0; font-size: 13px; color: #6b7280;">Fecha: {{ date('d/m/Y', strtotime($po->created_at)) }}</p>
        </div>

        <div class="content">
            <p>Estimado Proveedor,</p>
            
            @if($customMessage)
            <div class="message-box">
                <strong>Nota del Solicitante:</strong><br/>
                {!! nl2br(e($customMessage)) !!}
            </div>
            @endif

            <p>Por favor gestionar la siguiente solicitud de mercadería:</p>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th class="text-right">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($po->items as $item)
                        <tr>
                            <td>
                                <strong>{{ $item->product ? $item->product->nombre : 'Item #'.$item->product_id }}</strong>
                            </td>
                            <td>{{ $item->product ? ($item->product->sku_interno ?: $item->product->sku) : '-' }}</td>
                            <td class="text-right"><strong>{{ $item->quantity_ordered }}</strong></td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            
            <p style="margin-top: 20px; font-size: 13px;">
                Quedamos a la espera de su confirmación y factura correspondiente.
            </p>
        </div>

        <div class="footer">
            <p>Este correo fue enviado automáticamente por el sistema ERP de Repuestos KM21.</p>
        </div>
    </div>
</body>
</html>
