# PLAN DE IMPLEMENTACIÓN COMPLETO - ERP Productos v4.0

## 🎯 OBJETIVO

Completar el sistema de gestión de productos con:

-   ✅ Stock disponible
-   ✅ Modal rediseñado (2 columnas, secciones claras, scroll)
-   ✅ Filtros de búsqueda por vehículo
-   ✅ Flujo completo de alta/edición

---

## 📋 ESTADO ACTUAL

### ✅ YA IMPLEMENTADO:

1. Creación/edición básica de productos
2. Compatibilidades con vehículos (marca, modelo, años, motor, versión)
3. Detección automática de compatibilidades
4. Gestor de proveedores
5. Inferencia de motor automática

###❌ FALTA IMPLEMENTAR:

1. Campo `stock_disponible` en base de datos
2. UI de stock en el modal
3. Rediseño del modal (2 columnas, secciones, scroll interno)
4. Filtros de búsqueda por vehículo en listado
5. Mejoras de UX general

---

## 🔧 IMPLEMENTACIÓN PASO A PASO

### **FASE 1: Stock Disponible**

#### 1.1 Migración de Base de Datos

```php
// database/migrations/YYYY_MM_DD_add_stock_disponible_to_productos.php
$table->decimal('stock_disponible', 12, 2)->nullable()->after('stock_controlado');
```

#### 1.2 Modelo Producto

-   Agregar `stock_disponible` a `$fillable`
-   Agregar cast `'stock_disponible' => 'decimal:2'`

#### 1.3 API

-   Incluir en validación de `store()` y `update()`
-   Incluir en respuestas JSON

#### 1.4 Frontend

-   Input numérico en modal
-   Solo visible si `stock_controlado === true`
-   Validación >= 0

---

### **FASE 2: Rediseño del Modal**

#### 2.1 Estructura Visual

```
┌──────────────────────────────────────────────────────┐
│ [Crear/Editar] Producto                         [✕]  │
├──────────────────────────────────────────────────────┤
│ ┌─ DATOS BÁSICOS ─────┬─ PRECIOS DE VENTA ─────────┐│
│ │ SKU Interno          │ Precio Lista              ││
│ │ Código de Barras     │ Precio Oferta             ││
│ │ Nombre *             │ Moneda                    ││
│ │ Descripción corta    │ Alícuota IVA (%)          ││
│ └──────────────────────┴───────────────────────────┘│
│                                                      │
│ ┌─ COSTOS ────────────┬─ STOCK ───────────────────┐│
│ │ Costo Última Compra │ ☑ Controlar stock         ││
│ │                     │ Stock Disponible: [___]   ││
│ └──────────────────────┴───────────────────────────┘│
│                                                      │
│ ┌─ FLAGS ───────────────────────────────────────────┐│
│ │ ☑ Producto activo                                ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ 🚗 COMPATIBILIDAD CON VEHÍCULOS ────────────────┐│
│ │ Renault Clio (2004-2012) 1.6 16v        [✕]     ││
│ │                                                   ││
│ │ [Marca ▼] [Modelo ▼] [Desde] [Hasta]            ││
│ │ [Motor] [Versión] [Observación]                  ││
│ │ [+ Agregar compatibilidad]                       ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ 🧾 PROVEEDORES ──────────────────────────────────┐│
│ │ Proveedor SA | SKU: ABC | $1,500.00      [✕]    ││
│ │                                                   ││
│ │ [Proveedor ▼]                                    ││
│ │ [SKU del proveedor]                              ││
│ │ [Precio de compra *]                             ││
│ │ [+ Agregar proveedor]                            ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ [Cancelar]                       [Guardar cambios]  │
└──────────────────────────────────────────────────────┘
```

#### 2.2 Implementación CSS

-   Grid 2 columnas para secciones superiores
-   Secciones con bordes y padding
-   Scroll interno en el cuerpo del modal
-   Altura máxima del modal: 90vh
-   Responsive: 1 columna en mobile

---

### **FASE 3: Filtros de Búsqueda**

#### 3.1 Backend - Extend `index()` en ProductoApiController

```php
public function index(Request $request) {
    $query = Producto::with(['marca', 'familia', 'subfamilia']);

    // Búsqueda por texto (existente)
    if ($request->has('search')) {
        // ...
    }

    // NUEVO: Filtros por vehículo
    if ($request->has('vehiculo_marca_id')) {
        $query->whereHas('vehiculos', function($q) use ($request) {
            $q->where('vehiculo_marca_id', $request->vehiculo_marca_id);

            if ($request->has('vehiculo_modelo_id')) {
                $q->where('vehiculo_modelo_id', $request->vehiculo_modelo_id);
            }

            if ($request->has('anio')) {
                $anio = (int) $request->anio;
                $q->where(function($qq) use ($anio) {
                    $qq->where(function($q1) use ($anio) {
                        $q1->whereNull('anio_desde')
                           ->whereNull('anio_hasta');
                    })
                    ->orWhere(function($q2) use ($anio) {
                        $q2->where('anio_desde', '<=', $anio)
                           ->where(function($q3) use ($anio) {
                               $q3->where('anio_hasta', '>=', $anio)
                                  ->orWhereNull('anio_hasta');
                           });
                    });
                });
            }

            if ($request->has('motor')) {
                $q->where('motor', 'like', '%' . $request->motor . '%');
            }
        });
    }

    return $query->paginate(50);
}
```

#### 3.2 Frontend - Panel de Filtros

```jsx
<div className="filter-panel">
    <select onChange={(e) => setFilterMarca(e.target.value)}>
        <option value="">Todas las marcas</option>
        {/* ... */}
    </select>

    <select
        onChange={(e) => setFilterModelo(e.target.value)}
        disabled={!filterMarca}
    >
        <option value="">Todos los modelos</option>
        {/* ... */}
    </select>

    <input
        type="number"
        placeholder="Año"
        onChange={(e) => setFilterAnio(e.target.value)}
    />

    <input
        type="text"
        placeholder="Motor (ej: 1.6 16v)"
        onChange={(e) => setFilterMotor(e.target.value)}
    />

    <button onClick={aplicarFiltros}>Buscar</button>
    <button onClick={limpiarFiltros}>Limpiar</button>
</div>
```

---

## 📝 FLUJO DE USO FINAL

### **CREAR PRODUCTO:**

1. Usuario hace clic en "+ Nuevo Producto"
2. Modal se abre en modo creación
3. Usuario completa:
    - **Datos básicos:** Nombre, código de barras
    - **Precios:** Precio lista y oferta
    - **Costos:** Costo última compra
    - **Stock:** Marca "Controlar stock" e ingresa cantidad
4. Hace clic en "Crear producto"
5. **Backend detecta automáticamente compatibilidades** del nombre
6. Modal pasa a modo edición mostrando las compatibilidades detectadas
7. Usuario puede:
    - Agregar más compatibilidades manualmente
    - Agregar proveedores
    - Ajustar datos si es necesario
8. Guarda cambios finales

### **EDITAR PRODUCTO:**

1. Usuario hace doble clic en producto del listado
2. Modal se abre con TODOS los datos cargados:
    - Datos básicos
    - Precios y costos
    - Stock actual
    - Compatibilidades existentes
    - Proveedores asociados
3. Usuario modifica lo que necesite
4. Guarda cambios
5. Si cambió el nombre, **se reejecutautomáticamente la detección** (sin eliminar las compatibilidades existentes)

### **BUSCAR POR VEHÍCULO:**

1. Usuario selecciona filtros:
    - Marca: Ford
    - Modelo: Fiesta
    - Año: 2015
    - Motor: 1.6
2. Hace clic en "Buscar"
3. Listado muestra SOLO productos compatibles con ese vehículo específico
4. Usuario puede editar cualquier producto del filtro

---

## 🎨 COMPONENTES A CREAR/MODIFICAR

### Backend:

1. `database/migrations/...add_stock_disponible.php` (NUEVO)
2. `app/Models/Producto.php` (agregar stock_disponible a $fillable)
3. `app/Http/Controllers/Erp/ProductoApiController.php` (filtros)

### Frontend:

4. `ProductosListPage.jsx` (filtros + modal rediseñado)
5. CSS para secciones y grid del modal

---

## ✅ CHECKLIST FINAL

-   [ ] Migración de stock_disponible ejecutada
-   [ ] Campo stock_disponible en modelo y validaciones
-   [ ] Input de stock en modal (condicional)
-   [ ] Modal rediseñado con 2 columnas
-   [ ] Scroll interno en modal funcionando
-   [ ] Secciones visuales claras (bordes, títulos)
-   [ ] Filtros de vehículo en backend
-   [ ] Panel de filtros en frontend
-   [ ] Búsqueda por vehículo funcional
-   [ ] Flujo completo probado
-   [ ] Documentación actualizada

---

**Próximo paso:** Crear migración de stock_disponible y comenzar implementación
