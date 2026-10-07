# 🚌 Explicación de la Solución - Parte de Sergio (Fase 3 y Fase 4)

Este documento detalla toda la arquitectura, código implementado, configuración de base de datos con Docker y la guía paso a paso para sustentar y explicar el proyecto.

---

## 📌 1. ¿Qué se realizó en la parte de Sergio?

Sergio es el encargado de la **capa operativa y transaccional** del sistema de transporte masivo:
1. **Módulo Bus**: Gestión de la flota de buses (placa, modelo, capacidad, estado operativo y borrado lógico).
2. **Módulo Alerta (Incidentes)**: Registro y monitoreo de emergencias o fallas en vía. Requiere relaciones con **Bus**, **Ruta** y **Estación**.
3. **Consulta SQL con JOINs (`@Query`)**: Requisito clave donde se consolidan en una sola consulta las alertas activas con los datos del bus, ruta y estación asociada.
4. **Servidor PostgreSQL en Docker**: Contenedor configurado con persistencia de datos y credenciales acordes a `application-dev.properties`, más interfaz web pgAdmin.
5. **Integración Frontend**: Conexión del formulario de incidentes en `app.js` con el endpoint de `AlertaController`, enviando la estructura exacta de `AlertaRequest`.

---

## 📂 2. Estructura de Archivos del Módulo 2 (`modulo2`)

Todos los archivos desarrollados para Sergio se encuentran organizados dentro del paquete `com.roles.usermanagement.modulo2` (compilando en el proyecto Spring Boot) y respaldados en la carpeta raíz `modulo2/`:

```text
modulo2/
├── docker-compose.yml                  # Configuración de PostgreSQL y pgAdmin
├── EXPLICACION_PARTE_SERGIO.md         # Esta guía de sustentación
├── bus/                                # Módulo de Gestión de Buses
│   ├── Bus.java                        # Entidad JPA (tabla: transporte_bus)
│   ├── BusRequest.java                 # DTO de entrada con validaciones (@NotBlank, @Min, @Max)
│   ├── BusResponse.java                # DTO inmutable de respuesta
│   ├── BusRepository.java              # Repositorio Spring Data JPA con bloqueo pesimista
│   ├── BusService.java                 # Lógica de negocio transaccional (@Transactional)
│   └── BusController.java              # Controlador REST protegido con seguridad JWT y Swagger
└── alerta/                             # Módulo de Alertas e Incidentes
    ├── Alerta.java                     # Entidad JPA con relaciones @ManyToOne
    ├── AlertaRequest.java              # DTO para el registro de incidentes desde el frontend
    ├── AlertaResponse.java             # DTO de respuesta estándar
    ├── AlertaDetalleResponse.java      # DTO proyectado para la consulta con JOINs
    ├── AlertaRepository.java           # TAREA CLAVE: Consulta @Query con JOINs
    ├── AlertaService.java              # Lógica transaccional para registrar y listar alertas
    └── AlertaController.java           # Endpoints REST (/api/alertas y /api/alertas/activas)
```

---

## 🔍 3. Detalle Técnico de los Archivos Clave

### A. Módulo Bus
- **`Bus.java`**: Entidad mapeada a `transporte_bus`. Campos: `id`, `placa` (única), `modelo`, `capacidad`, `estado` (`OPERATIVO`, `MANTENIMIENTO`, `FUERA_SERVICIO`) y `activo` (`boolean` para soft delete).
- **`BusService.java`**:
  - Valida que la placa sea única antes de guardar (`existsByPlaca`).
  - Utiliza bloqueo pesimista (`findForUpdate`) al actualizar para evitar condiciones de carrera concurrentes.
  - El borrado lógico `deactivate(Long id)` desactiva el bus conservando la integridad referencial de las alertas pasadas.
- **`BusController.java`**: Rutas `/api/buses` protegidas con las autoridades `BUS_READ`, `BUS_CREATE`, `BUS_UPDATE` y `BUS_DELETE`.

---

### B. Módulo Alerta (Incidentes en Vía)
- **`Alerta.java`**: Entidad mapeada a `transporte_alerta`.
  - Relación obligatoria con `Bus`: `@ManyToOne @JoinColumn(name = "bus_id", nullable = false)`.
  - Relación opcional con `Ruta`: `@ManyToOne @JoinColumn(name = "ruta_id")`.
  - Relación opcional con `Estacion`: `@ManyToOne @JoinColumn(name = "estacion_id")`.
  - Campos de auditoría: `fechaHora` y `registradoPor` (obtenido automáticamente de la sesión del usuario).

- **`AlertaRepository.java` (TAREA CLAVE DE SERGIO)**:
  Contiene la consulta requerida mediante `@Query` con proyección al DTO `AlertaDetalleResponse`:
  ```java
  @Query("""
      SELECT new com.roles.usermanagement.modulo2.alerta.AlertaDetalleResponse(
          a.id,
          a.tipo,
          a.descripcion,
          a.severidad,
          a.fechaHora,
          a.activo,
          a.registradoPor,
          b.id,
          b.placa,
          b.modelo,
          r.id,
          r.codigo,
          r.nombre,
          e.id,
          e.nombre
      )
      FROM Alerta a
      JOIN a.bus b
      LEFT JOIN a.ruta r
      LEFT JOIN a.estacion e
      WHERE a.activo = true
      ORDER BY a.fechaHora DESC
  """)
  List<AlertaDetalleResponse> findAlertasActivasConJoin();
  ```
  > **¿Por qué se diseñó así?**
  > Utiliza `JOIN` hacia `bus` (obligatorio) y `LEFT JOIN` hacia `ruta` y `estacion` (porque una alerta puede ocurrir en un bus que esté en patio o taller sin una ruta o estación asignada). El constructor `new AlertaDetalleResponse(...)` mapea directamente los datos planos para un consumo óptimo sin problemas de Lazy Initialization.

- **`AlertaService.java`**:
  - `create(AlertaRequest d, String username)`: Valida la existencia y estado activo del bus, de la ruta (si aplica) y de la estación (si aplica). Asigna el usuario autenticado que reportó la falla.
  - `listarActivasConJoin()`: Retorna la lista consolidada de incidentes activos para el panel de control.

- **`AlertaController.java`**:
  - `POST /api/alertas`: Registra una alerta tomando el usuario del token JWT (`Authentication`).
  - `GET /api/alertas/activas`: Endpoint especializado para el monitor de incidentes en tiempo real.

---

## 🐳 4. Servidor PostgreSQL con Docker

Se creó el archivo `docker-compose.yml` con la siguiente configuración:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres_transporte
    restart: unless-stopped
    environment:
      POSTGRES_DB: sistema_gestion_usuarios
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin_transporte
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### Comandos para ejecutar Docker:
1. Abrir una terminal en la raíz del proyecto.
2. Iniciar el servidor:
   ```bash
   docker compose up -d
   ```
3. Verificar que el contenedor esté corriendo:
   ```bash
   docker ps
   ```
4. Para ver las tablas desde pgAdmin, abrir en el navegador `http://localhost:5050`:
   - Correo: `admin@admin.com`
   - Contraseña: `admin123`
   - Conexión a Host: `postgres` o `localhost`, Puerto: `5432`, Base de datos: `sistema_gestion_usuarios`.

---

## 💻 5. Integración Frontend (Fase 4 - Sergio)

En `Frontend/app.js`:
1. Se añadieron las vistas de `buses` y `alertas` en el objeto `sections`.
2. Se implementó el formulario modal para el registro de incidentes:
   - Carga dinámica de los buses registrados y activos en un `<select>`.
   - Carga de rutas y estaciones disponibles.
   - Selector de tipo de incidente (`FALLA_MECANICA`, `ACCIDENTE`, `RETRASO`, `EMERGENCIA_MEDICA`, etc.).
   - Selector de severidad (`ALTA`, `MEDIA`, `BAJA`).
   - Campo de descripción detallada.
3. El envío del formulario construye y despacha por `fetch` exactamente el JSON requerido por `AlertaRequest`:
   ```json
   {
     "tipo": "FALLA_MECANICA",
     "descripcion": "Fallo en el sistema de frenos",
     "severidad": "ALTA",
     "busId": 1,
     "rutaId": 2,
     "estacionId": 1
   }
   ```

---

## 🎤 6. Guía para Explicar tu Trabajo al Profesor o Evaluador

Puedes utilizar esta estructura clara y profesional:

1. **Introducción del Rol**:
   > *"Profesor, dentro del proyecto me correspondió el rol de Sergio (Fase 3 y Fase 4), encargado de la capa transaccional y operativa del transporte: la flota de buses y el sistema de alertas e incidentes."*

2. **Estructura y Limpieza (Fase 1 y Módulo 2)**:
   > *"Iniciamos realizando la limpieza de los módulos antiguos de ejemplo (clientes, productos y ventas). Todos los nuevos archivos de mi desarrollo los agrupé dentro del paquete y carpeta `modulo2`, estructurados bajo la arquitectura de la plantilla: entidad, DTOs de Request y Response, repositorio, servicio transaccional y controlador REST."*

3. **Base de Datos y Docker**:
   > *"Configuré un servidor local de PostgreSQL 16 mediante Docker Compose con el nombre de base de datos `sistema_gestion_usuarios` y usuario `admin`, coincidiendo exactamente con la configuración de `application-dev.properties`. Además, incluí pgAdmin para visualizar el esquema y las tablas relacionales."*

4. **La Consulta Clave con JOINs en `AlertaRepository`**:
   > *"Mi tarea técnica principal fue la consulta `@Query` en `AlertaRepository`. Implementé una consulta JPQL con proyección directa a `AlertaDetalleResponse` haciendo un `JOIN` con la tabla de buses y `LEFT JOIN` con rutas y estaciones, trayendo únicamente las alertas activas ordenadas cronológicamente. Esto evita el problema de n+1 consultas y optimiza la carga en memoria."*

5. **Lógica de Negocio y Seguridad**:
   > *"En `AlertaService` aseguré que no se pueda registrar un incidente sobre un bus inactivo o inexistente, y que el usuario que reporta la alerta se extraiga directamente del token JWT de la sesión. Los endpoints están asegurados con anotaciones `@PreAuthorize` verificando permisos individuales como `BUS_READ` y `ALERTA_CREATE`."*

6. **Integración Frontend**:
   > *"En la Fase 4, conecté el formulario de registro de incidentes en `app.js` con el endpoint `POST /api/alertas`. El formulario carga los buses disponibles y envía un payload JSON que mapea exactamente 1 a 1 con el record `AlertaRequest.java`."*

7. **Compilación y Pruebas**:
   > *"Todo el código fue probado y validado con Gradle (`./gradlew test` y `./gradlew compileJava`), pasando todas las pruebas de integración sin errores."*
