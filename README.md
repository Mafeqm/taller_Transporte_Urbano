# 🚍 Taller de Gestión y Operación de Transporte Urbano

Sistema integral de gestión de flota de transporte público, rutas, estaciones, conductores y monitoreo de alertas e incidentes en tiempo real, construido con **Spring Boot (Java 21)**, **PostgreSQL** y **Frontend web (HTML, CSS y JavaScript)**.

Documento de especificaciones del taller: [`taller.pdf`](taller.pdf)

---

## 👥 Equipo y Distribución del Trabajo

El desarrollo del taller se organizó en 4 fases distribuidas entre **Mafe** y **Sergio**:

### 🛠️ Fase 1: Limpieza del Repositorio (Juntos)
- Eliminación de los módulos de ejemplo antiguos (`customer`, `product` y `sale`).
- Configuración de la base de datos PostgreSQL local y dockerizada.

### 🛣️ Fase 2: Infraestructura Base del Transporte (Mafe)
- **Módulo Ruta**: Trazados, códigos y líneas del sistema.
- **Módulo Estación**: Puntos de parada y estaciones principales.
- **Módulo Conductor**: Personal operativo y licencias de conducción.
- Adaptación de vistas de catálogos y consumo de APIs en el Frontend.

### 🚨 Fase 3: Operación, Flota y Alertas (Sergio)
- **Módulo Bus**: Gestión de vehículos, capacidades, placas y estado operativo.
- **Módulo Alerta**: Monitoreo de emergencias, fallas mecánicas y retrasos.
- **Tarea Clave Sergio**: Consulta especializada con `@Query` en `AlertaRepository` realizando los `JOIN` y `LEFT JOIN` hacia buses, rutas y estaciones, mapeado directamente al DTO `AlertaDetalleResponse`.
- Lógica transaccional de validación relacional en `AlertaService`.
- Creación del servidor PostgreSQL y pgAdmin con Docker Compose (`docker-compose.yml`).

### 💻 Fase 4: Integración del Frontend (Mafe & Sergio)
- **Mafe**: Conexión de peticiones `fetch` hacia `RutaController` y `EstacionController`.
- **Sergio**: Conexión del formulario de registro de incidentes (`🚨 Registrar incidente`) hacia `AlertaController`, enviando la estructura exacta del JSON requerido por `AlertaRequest.java`.

---

## 📁 Infraestructura de Archivos del Proyecto

Todos los módulos siguen la arquitectura estándar de 6 archivos: Entidad, DTO Request con validaciones Jakarta, DTO Response inmutable, Repositorio Spring Data con bloqueo pesimista, Servicio transaccional y Controlador REST seguro con JWT y Swagger.

```text
├── docker-compose.yml                        # Servidor PostgreSQL 16 y pgAdmin 4
├── taller.pdf                                # Archivo de especificaciones del taller
├── Frontend/                                 # Interfaz de usuario
│   ├── index.html                            # Portal web de acceso y dashboard
│   ├── styles.css                            # Estilos responsive
│   └── app.js                                # Lógica cliente, formularios y fetch
└── spring-security-user-role-management/     # Backend Spring Boot
    ├── build.gradle                          # Dependencias y configuración
    ├── gradlew.bat                           # Wrapper de Gradle con autodetección de Java 21
    └── src/main/java/com/roles/usermanagement/
        ├── domain/service/UserRoles.java     # Permisos BUS_*, ALERTA_*, RUTA_*, etc.
        └── modules/                          # Módulos de transporte
            ├── ruta/                         # Módulo Ruta (Mafe)
            │   ├── Ruta.java
            │   ├── RutaRequest.java
            │   ├── RutaResponse.java
            │   ├── RutaRepository.java
            │   ├── RutaService.java
            │   └── RutaController.java
            ├── estacion/                     # Módulo Estación (Mafe)
            │   ├── Estacion.java
            │   ├── EstacionRequest.java
            │   ├── EstacionResponse.java
            │   ├── EstacionRepository.java
            │   ├── EstacionService.java
            │   └── EstacionController.java
            ├── conductor/                    # Módulo Conductor (Mafe)
            │   ├── Conductor.java
            │   ├── ConductorRequest.java
            │   ├── ConductorResponse.java
            │   ├── ConductorRepository.java
            │   ├── ConductorService.java
            │   └── ConductorController.java
            ├── bus/                          # Módulo Bus (Sergio)
            │   ├── Bus.java
            │   ├── BusRequest.java
            │   ├── BusResponse.java
            │   ├── BusRepository.java
            │   ├── BusService.java
            │   └── BusController.java
            └── alerta/                       # Módulo Alerta (Sergio)
                ├── Alerta.java
                ├── AlertaRequest.java
                ├── AlertaResponse.java
                ├── AlertaDetalleResponse.java # DTO para consulta con JOINs
                ├── AlertaRepository.java      # Consulta @Query con JOINs (Tarea Sergio)
                ├── AlertaService.java         # Lógica de registro y listado
                └── AlertaController.java      # Endpoints REST (/api/alertas/activas)
```

---

## 🚀 Guía Rápida de Ejecución

### 1. Iniciar PostgreSQL con Docker
En la raíz del proyecto:
```bash
docker compose up -d
```
- **PostgreSQL**: `localhost:5432` (BD: `sistema_gestion_usuarios`, Usuario: `admin`, Clave: `admin123`)
- **pgAdmin**: `http://localhost:5050` (Usuario: `admin@admin.com`, Clave: `admin123`)

### 2. Ejecutar el Backend (Spring Boot)
```bash
cd spring-security-user-role-management
.\gradlew.bat bootRun
```
- Servidor: `http://localhost:8050`
- Documentación Swagger: `http://localhost:8050/swagger-ui.html`

### 3. Abrir el Frontend
Abre el archivo `Frontend/index.html` en tu navegador.
- **Usuario administrador**: `superadmin`
- **Contraseña**: `SuperAdmin123!`
