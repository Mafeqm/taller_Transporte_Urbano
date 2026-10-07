# 🚍 Backend de Gestión y Operación de Transporte Urbano

Sistema Backend REST con **Java 21, Spring Boot y PostgreSQL** para la administración integral de flotas de transporte público, rutas, estaciones, conductores y monitoreo de alertas operacionales en tiempo real. Integra autenticación **JWT**, control de acceso basado en roles y permisos individuales, y contenedorización con **Docker Compose**.

El frontend desacoplado se encuentra en la carpeta hermana `Frontend` y utiliza HTML5, CSS3 y JavaScript nativo.

---

## Contenido

- [Inicio rápido](#inicio-rápido)
- [Base de datos con Docker](#base-de-datos-con-docker)
- [Configuración por perfiles y JWT](#configuración-por-perfiles-y-jwt)
- [Administrador inicial y autenticación](#administrador-inicial-y-autenticación)
- [Modelo de roles y permisos de transporte](#modelo-de-roles-y-permisos-de-transporte)
- [Endpoints de la API](#endpoints-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Swagger y Pruebas](#swagger-y-pruebas)

---

## Inicio rápido

Requisitos: **JDK 21** y **PostgreSQL** (o Docker). El proyecto incluye Gradle Wrapper portable; no necesitas instalar Gradle globalmente.

Desde la carpeta del backend (`spring-security-user-role-management`):

```powershell
.\gradlew.bat bootRun
```

El perfil predeterminado es `dev` y el puerto es `8050`. Hibernate utiliza `ddl-auto=update` para sincronizar las tablas con la base de datos automáticamente.

Para compilar y ejecutar todas las pruebas unitarias y de integración:

```powershell
.\gradlew.bat clean test
```

---

## Base de datos con Docker

En la raíz del repositorio se incluye un `docker-compose.yml` listo para producción o desarrollo local:

```bash
docker compose up -d
```

- **PostgreSQL**: `localhost:5432`
  - Base de datos: `sistema_gestion_usuarios`
  - Usuario: `admin`
  - Contraseña: `admin123`
- **pgAdmin 4**: `http://localhost:5050`
  - Usuario: `admin@admin.com`
  - Contraseña: `admin123`

---

## Configuración por perfiles y JWT

| Archivo | Responsabilidad |
| --- | --- |
| [application.properties](src/main/resources/application.properties) | Selección del perfil activo (`dev`) |
| [application-dev.properties](src/main/resources/application-dev.properties) | Conexión a PostgreSQL, puerto 8050 y configuración JWT |
| [application-test.properties](src/test/resources/application-test.properties) | H2 en modo PostgreSQL para pruebas automatizadas |

Configuración JWT en `application-dev.properties`:

```properties
security.jwt.secret=${JWT_SECRET:User_M4n4gement}
security.jwt.issuer=${JWT_ISSUER:User_R0les_M4n4gement}
security.jwt.expiration=${JWT_EXPIRATION:15d}
```

---

## Administrador inicial y autenticación

Al iniciar la aplicación por primera vez, `SecurityBootstrapService` inicializa el catálogo de roles, permisos y la cuenta de administrador inicial:

| Campo | Valor predeterminado |
| --- | --- |
| Usuario | `superadmin` |
| Contraseña | `SuperAdmin123!` |
| Rol | `ADMIN` (cuenta con todos los permisos del sistema) |

### Autenticación paso a paso:
1. Petición `POST /api/auth/login`:
```json
{
  "username": "superadmin",
  "password": "SuperAdmin123!"
}
```
2. La API retorna el token JWT como texto plano.
3. Se incluye el header `Authorization: Bearer <token>` en todas las peticiones a endpoints protegidos.
4. `GET /api/auth/me` devuelve los datos del usuario logueado, su rol y su lista de permisos efectivos.

---

## Modelo de roles y permisos de transporte

Cada cuenta cuenta con un rol principal y la posibilidad de recibir permisos individuales específicos:

```text
Permisos Efectivos = Permisos del Rol + Permisos Individuales Directos
```

### Autoridades del sistema de transporte:
* **Flota de Buses**: `BUS_READ`, `BUS_CREATE`, `BUS_UPDATE`, `BUS_DELETE`
* **Alertas e Incidentes**: `ALERTA_READ`, `ALERTA_CREATE`, `ALERTA_UPDATE`, `ALERTA_DELETE`
* **Rutas Urbanas**: `RUTA_READ`, `RUTA_CREATE`, `RUTA_UPDATE`, `RUTA_DELETE`
* **Estaciones**: `ESTACION_READ`, `ESTACION_CREATE`, `ESTACION_UPDATE`, `ESTACION_DELETE`
* **Conductores**: `CONDUCTOR_READ`, `CONDUCTOR_CREATE`, `CONDUCTOR_UPDATE`, `CONDUCTOR_DELETE`
* **Gestión de Seguridad**: `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `ROLE_ASSIGN`, `PERMISSION_ASSIGN`, `ROLE_MANAGE`, `PERMISSION_MANAGE`

---

## Endpoints de la API

### 🚌 Flota de Buses (`/api/buses`)
| Método | Endpoint | Permiso requerido | Descripción |
| --- | --- | --- | --- |
| GET | `/api/buses` | `BUS_READ` | Lista todos los buses |
| GET | `/api/buses/{id}` | `BUS_READ` | Detalle de un bus |
| POST | `/api/buses` | `BUS_CREATE` | Registra un nuevo bus con validación de placa única |
| PUT | `/api/buses/{id}` | `BUS_UPDATE` | Actualiza bus con bloqueo pesimista |
| DELETE | `/api/buses/{id}` | `BUS_DELETE` | Desactiva o elimina un bus |

### ⚠️ Alertas e Incidentes (`/api/alertas`)
| Método | Endpoint | Permiso requerido | Descripción |
| --- | --- | --- | --- |
| GET | `/api/alertas` | `ALERTA_READ` | Listado general de alertas |
| GET | `/api/alertas/activas` | `ALERTA_READ` | **Consulta especializada con JOINs** (vincula Alerta, Bus, Ruta y Estación) |
| POST | `/api/alertas` | `ALERTA_CREATE` | Registra una alerta o incidente en tiempo real |
| PUT | `/api/alertas/{id}` | `ALERTA_UPDATE` | Actualiza estado de alerta o marca como resuelta |
| DELETE | `/api/alertas/{id}` | `ALERTA_DELETE` | Elimina una alerta |

### 🛣️ Rutas (`/api/rutas`)
| Método | Endpoint | Permiso requerido | Descripción |
| --- | --- | --- | --- |
| GET | `/api/rutas` | `RUTA_READ` | Listado de rutas |
| POST | `/api/rutas` | `RUTA_CREATE` | Creación de ruta |
| PUT | `/api/rutas/{id}` | `RUTA_UPDATE` | Edición de ruta |
| DELETE | `/api/rutas/{id}` | `RUTA_DELETE` | Eliminación de ruta |

### 🚉 Estaciones (`/api/estaciones`)
| Método | Endpoint | Permiso requerido | Descripción |
| --- | --- | --- | --- |
| GET | `/api/estaciones` | `ESTACION_READ` | Listado de estaciones |
| POST | `/api/estaciones` | `ESTACION_CREATE` | Creación de estación vinculada a una ruta |
| PUT | `/api/estaciones/{id}` | `ESTACION_UPDATE` | Modificación de estación |
| DELETE | `/api/estaciones/{id}` | `ESTACION_DELETE` | Eliminación de estación |

### 👨‍✈️ Conductores (`/api/conductores`)
| Método | Endpoint | Permiso requerido | Descripción |
| --- | --- | --- | --- |
| GET | `/api/conductores` | `CONDUCTOR_READ` | Listado de conductores |
| POST | `/api/conductores` | `CONDUCTOR_CREATE` | Registro de conductor y asignación de bus |
| PUT | `/api/conductores/{id}` | `CONDUCTOR_UPDATE` | Modificación de datos de conductor |
| DELETE | `/api/conductores/{id}` | `CONDUCTOR_DELETE` | Eliminación de conductor |

---

## Estructura del proyecto

Todos los módulos siguen una arquitectura limpia en 6 componentes desacoplados:

```text
src/main/java/com/roles/usermanagement/
├── domain/                      # DTOs, servicios y contratos de seguridad
│   ├── dto/
│   ├── repository/
│   └── service/UserRoles.java   # Catálogo enum de roles y autoridades
├── persistance/                 # Entidades y repositorios de seguridad y usuarios
│   ├── crud/
│   ├── entity/
│   └── repository/
├── web/                         # Controladores JWT, filtros y configuración Swagger/CORS
│   ├── config/
│   └── controller/
└── modules/                     # Módulos del Sistema de Transporte Urbano
    ├── ruta/                    # Módulo Ruta (Mafe)
    ├── estacion/                # Módulo Estación (Mafe)
    ├── conductor/               # Módulo Conductor (Mafe)
    ├── bus/                     # Módulo Bus con bloqueo pesimista (Sergio)
    └── alerta/                  # Módulo Alerta con consulta JPQL JOIN (Sergio)
```

---

## Swagger y Pruebas

* **Swagger UI interactivo**: `http://localhost:8050/swagger-ui.html`
* **OpenAPI Docs**: `http://localhost:8050/v3/api-docs`
* **Ejecución de pruebas automatizadas**:
```powershell
.\gradlew.bat test
```
Todas las pruebas de integración se ejecutan contra una base de datos en memoria H2 configurada en compatibilidad PostgreSQL, validando la integridad del bootstrap, la autenticación JWT y las operaciones transaccionales sobre la flota y las alertas.
