# 🚍 Nexo Transporte · Frontend de Gestión Urbana

Interfaz web responsive para el sistema de operación de transporte público y seguridad, construida con **HTML5, CSS3 y JavaScript nativo**. Conecta flotas de buses, incidentes y alertas, rutas, estaciones, conductores, usuarios y permisos mediante la API REST con autenticación JWT de Spring Boot. No requiere dependencias de npm, frameworks pesados ni herramientas de empaquetado.

---

## Inicio rápido

1. Inicia la base de datos PostgreSQL con Docker:
   ```bash
   docker compose up -d
   ```
2. Inicia el backend de Spring Boot:
   ```powershell
   cd spring-security-user-role-management
   .\gradlew.bat bootRun
   ```
3. Abre [index.html](index.html) directamente en cualquier navegador moderno o utiliza una extensión de servidor web local como Live Server.
4. En la pantalla de login, asegúrate de que la URL de la API apunte a `http://localhost:8050` (sin `/api` al final).
5. Inicia sesión con la cuenta de administrador:
   - **Usuario**: `superadmin`
   - **Contraseña**: `SuperAdmin123!`

---

## Pantallas y Acciones del Sistema

| Pantalla | Funcionalidad principal | Permisos requeridos |
| --- | --- | --- |
| **Inicio** | Dashboard general del sistema, accesos directos y estado de conexión | Usuario autenticado |
| **Buses** | Consulta de flota, placas, modelo, capacidad de pasajeros y estado operativo | `BUS_READ`, `BUS_CREATE`, `BUS_UPDATE`, `BUS_DELETE` |
| **Alertas e Incidentes** | Monitoreo en tiempo real de fallas mecánicas, emergencias, retrasos y consulta especializada con JOINs | `ALERTA_READ`, `ALERTA_CREATE`, `ALERTA_UPDATE`, `ALERTA_DELETE` |
| **Rutas** | Catálogo de rutas, códigos de línea, colores distintivos y estado | `RUTA_READ`, `RUTA_CREATE`, `RUTA_UPDATE`, `RUTA_DELETE` |
| **Estaciones** | Registro de paradas y terminales vinculadas a sus respectivas rutas | `ESTACION_READ`, `ESTACION_CREATE`, `ESTACION_UPDATE`, `ESTACION_DELETE` |
| **Conductores** | Padrón de choferes, documentos de identidad, contacto y asignación de buses | `CONDUCTOR_READ`, `CONDUCTOR_CREATE`, `CONDUCTOR_UPDATE`, `CONDUCTOR_DELETE` |
| **Usuarios** | Gestión de cuentas, habilitación, bloqueo y asignación de roles | `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE` |
| **Roles y Permisos** | Administración dinámica de catálogo de perfiles y autoridades | `ROLE_MANAGE`, `PERMISSION_MANAGE` |

---

## Reporte de Incidentes en Tiempo Real (Fase 4)

Desde el módulo **Alertas e Incidentes**, cualquier usuario con el permiso `ALERTA_CREATE` puede pulsar el botón **🚨 Registrar incidente**:
1. Se despliega un formulario modal dinámico.
2. Permite seleccionar el tipo de incidente (falla mecánica, retraso, emergencia médica, etc.) y su nivel de severidad/prioridad.
3. Permite vincular el incidente al ID de un bus en circulación y opcionalmente a la estación donde ocurrió.
4. El envío realiza una petición `POST /api/alertas` que persiste el incidente y lo refleja en la tabla de alertas activas.

---

## Estructura de Archivos

| Archivo | Responsabilidad |
| --- | --- |
| [index.html](index.html) | Estructura semántica, formulario de inicio de sesión, navegación lateral y contenedor de modales |
| [styles.css](styles.css) | Diseño responsive, variables de color CSS, diseño moderno de tablas y formularios |
| [app.js](app.js) | Cliente HTTP `fetch`, manejo de JWT en `sessionStorage`, control reactivo de vistas y despacho de formularios |
