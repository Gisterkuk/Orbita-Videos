# Negocio de demo (para grabar tutoriales)

> **Estado al 2026-10-12:** por decisión de la persona se usa el negocio **actual** (`negocio.orbita.site`)
> en vez de uno nuevo: se desactivaron (reversible) 13 productos y 4 categorías de prueba o que no son de
> ropa, se renombró "remeras" → "Remeras", se cargaron 4 productos con fotos de Unsplash, 4 clientes y
> 3 pedidos, y se cambió el banner y el menú de la tienda. Todo está en `~/orbita-videos/demo-manifiesto.json`
> (y la apariencia anterior en `demo-apariencia-antes.json`). Herramientas: `inventario.mjs` (solo lectura),
> `desactivar.mjs` (`--revertir`), `cargar.mjs` (retoma si se corta; `--limpiar`), `apariencia.mjs` (`--revertir`),
> `portada.mjs` (`--revertir`: sección de video apagada y contacto genérico en el pie, copia en `demo-portada-antes.json`).
> Los pedidos van como **venta anónima** (`comprador`: solo el nombre), porque la API exige email para
> pedidos de clientes registrados y a los clientes de demo no se les pone email.

Los tutoriales se graban en un negocio **propio de demo en producción**, no en el negocio de
prueba: así no aparecen "prueba 2", productos de $1, fotos con derechos ni nombres de clientes
reales. Decidido el 2026-10-12 (spec § 4b).

## 1. Alta (la hace la persona)
- Crear el negocio desde el alta normal de Órbita: **nombre y rubro creíbles** (p. ej. una remería),
  con su propia cuenta y contraseña. **Nadie más escribe la contraseña.**
- Activar el **paquete Avanzado** (Configuración → Suscripción) para poder mostrarlo.
- Completar Negocio (nombre, rubro, dirección), un logo propio y **Publicar tienda**.
- Entrar con `node herramientas/login.mjs` (ventana visible; la persona escribe su usuario y
  contraseña). Desde ahí el perfil persistente `~/orbita-videos/perfil` queda en el negocio de demo.
  Para volver al negocio anterior, la persona cierra sesión y entra al otro con el mismo `login.mjs`.

## 2. Datos (`herramientas/demo-datos/`)
- `datos.json`: 3 categorías, 6 productos con talles y stock, 4 clientes ficticios **sin email**
  (nunca se le manda un mail a nadie) y 3 pedidos (`notifyCustomer: false`).
- `fotos/`: solo fotos con licencia de uso comercial (Pixabay, Unsplash o propias de la persona),
  cada una con su fila en `fotos/LICENCIAS.md`. Bajar una foto requiere permiso de la persona.
- `node herramientas/demo-datos/cargar.mjs` muestra el plan; con `--confirmo` crea (solo después
  de que la persona lo apruebe en el chat). Todo lo creado queda en `~/orbita-videos/demo-manifiesto.json`
  a medida que se crea (si falla a mitad, el manifiesto refleja lo que sí se creó).
- `cargar.mjs --limpiar --confirmo` borra los productos y categorías del manifiesto. Clientes y
  pedidos no tienen DELETE en la API: quedan (son ficticios y del negocio de demo).
- El cargador se niega a tocar nada si la sesión es de otro negocio que el del manifiesto.

## 3. Estados que pide un guion
- **Mensaje sin leer** (para mostrar los numeritos del menú): la persona escribe un mensaje desde la
  tienda con una cuenta de cliente propia, justo antes de la toma. No se automatiza: crear cuentas
  de cliente en producción no lo hace el agente.
- **Pedidos en distintos estados, stock crítico, avisos de la campana:** salen de los pedidos y el
  stock de `datos.json` (la gorra y el buzo azul quedan con poco stock a propósito).
- **Vista de Empleado:** se recrea marcada en el video (no se invita a nadie por mail), salvo que la
  persona invite a un Empleado con un email propio.

## Endpoints usados (apps/api/src, verificados el 2026-10-12)
| Qué | Ruta | Dónde |
|---|---|---|
| Crear categoría | `POST /categories` | `categories/categories.controller.ts:27` |
| Borrar categoría | `DELETE /categories/:id` | `categories/categories.controller.ts:41` |
| Crear producto (variantes y stock inicial) | `POST /products` | `products/products.controller.ts:202` · DTO `products/dto/create-product.dto.ts` |
| Subir foto | `POST /products/:id/images` (multipart `file`) | `products/products.controller.ts:234` |
| Borrar producto | `DELETE /products/:id` | `products/products.controller.ts:227` |
| Crear cliente | `POST /customers` | `customers/customers.controller.ts:43` |
| Cargar pedido a mano | `POST /orders` (`notifyCustomer: false`) | `orders/orders.controller.ts:45` · DTO `orders/dto/create-order.dto.ts` |
