# Pedido — "Conocé tu panel" v2 (2026-10-12)

Tutorial para comerciantes que recién empiezan: qué es el panel y cómo moverse. Negocio:
negocio.orbita.site (tienda de ropa: Remeras, Buzos, Remeras oversize; productos, clientes y
pedidos de demo ya cargados). Empieza en el Inicio del panel y termina mostrando la tienda como la
ve un cliente.

Tiene que cubrir (lo pidió la persona sobre v1):
1. Panel vs. tienda: dos pantallas distintas — y si la voz nombra la tienda, la tienda se ve.
2. El menú de la izquierda: se abre al pasar el mouse, cada módulo tiene sus secciones, los
   **numeritos de aviso** (tienen que VERSE cuando se nombran: hay que conseguir un caso real, p. ej.
   un mensaje sin leer o pedidos pendientes, o recrearlo marcado), y el modo del menú (si se nombra,
   mostrar el efecto o no nombrarlo).
3. Roles: **"así lo vería un Empleado"** (recreación marcada si no hay forma real de mostrarlo) y que
   el **dueño puede habilitar o no módulos** — verificar en el código qué ve de verdad un Empleado y
   si el dueño puede habilitar módulos uno por uno ANTES de afirmarlo
   (apps/web/src/layouts/components/Sidebar.tsx, Configuración → Equipo).
4. La barra de arriba: buscador (lo que se promete buscar se tiene que ver), campana y **Orbi** con
   la acción completa: elegir o escribir la pregunta, que se vea la caja con lo escrito, el Enviar y
   la respuesta legible.
5. El avatar → Ir a la tienda, y la tienda.

Restricciones: no mostrar datos personales reales (emails, nombres de clientes reales); la voz es
ElevenLabs 8mBRP99B2Ng2QwsJMFQl; duración objetivo 1:30–2:00.

## Hechos verificados en el código (director, 2026-10-12)
- El menú filtra módulos por los **permisos del rol** (`apps/web/src/layouts/components/Sidebar.tsx:158-166`,
  con el mapa `permisosDelMenu.ts:13-26`) y también las secciones de cada módulo (`Sidebar.tsx:385`).
- El rol **Empleado** de fábrica trae: ver pedidos, ver clientes, ver inventario y catálogo, ver el equipo,
  ver y responder mensajes (`apps/api/src/onboarding/onboarding.service.ts:131-134`). Entonces ve
  **Pedidos, Clientes, Productos, Mensajes, Configuración (solo Equipo) y Manual**; **no ve Inicio,
  Difusión, Descuentos ni Avanzado** (`permisosDelMenu.ts:14-25`).
- Los permisos son **por rol, no por persona**: el dueño los cambia en Configuración → Equipo →
  "Gestionar roles" (pestaña Roles), tildando o destildando permisos del rol Empleado; también puede
  crear roles propios. El rol Propietario es de solo lectura (`Equipo.tsx:218-222, 309-320`).
  Decir "por defecto" al nombrar lo que ve un Empleado (un negocio puede haberlo cambiado).
- El negocio de demo no tiene empleados invitados: la vista de Empleado va como **recreación marcada**
  (rótulo fijo "Recreación"), o se muestra la pantalla real de Gestionar roles (eso sí es real y se
  puede grabar sin cambiar nada: abrir el rol en edición y cerrar sin guardar).
- Numeritos del menú: **solo** Mensajes (conversaciones sin leer) y Difusión (Instagram sin leer) tienen
  número (`Sidebar.tsx:206-233, 386`); los pedidos pendientes NO ponen número. Hay 3 pedidos de demo;
  un mensaje sin leer lo tiene que mandar la persona desde la tienda justo antes de la toma.
