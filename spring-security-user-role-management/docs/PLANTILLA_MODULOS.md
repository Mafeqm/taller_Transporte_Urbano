# 🚍 Guía de Arquitectura de Módulos: Sistema de Transporte

El backend sigue un patrón arquitectónico desacoplado y estrictamente tipado para cada módulo del dominio de transporte urbano (`ruta`, `estacion`, `conductor`, `bus`, `alerta`).

---

## 🏛️ Estructura Estándar de 6 Capas por Módulo

Cada módulo dentro del paquete `com.roles.usermanagement.modules.<nombre_modulo>` implementa las siguientes clases:

```text
modules/<modulo>/
├── Entidad.java            # Entidad JPA (@Entity, @Table, validaciones de integridad relacional)
├── EntidadRequest.java     # DTO de entrada con validaciones Jakarta (@NotBlank, @NotNull, @Min, etc.)
├── EntidadResponse.java    # Record o DTO inmutable de salida para desacoplar el modelo del contrato JSON
├── EntidadRepository.java  # Interfaz Spring Data JPA con consultas especializadas y bloqueos pesimistas
├── EntidadService.java     # Lógica de negocio transaccional (@Transactional) con validaciones
└── EntidadController.java  # Controlador REST expuesto bajo /api/<modulo> y protegido con @PreAuthorize
```

---

## 📋 Resumen de Módulos Implementados

| Módulo | Entidad Principal | Endpoints Base | Permisos Spring Security |
| --- | --- | --- | --- |
| **Ruta** | `Ruta` | `/api/rutas` | `RUTA_READ`, `RUTA_CREATE`, `RUTA_UPDATE`, `RUTA_DELETE` |
| **Estación** | `Estacion` | `/api/estaciones` | `ESTACION_READ`, `ESTACION_CREATE`, `ESTACION_UPDATE`, `ESTACION_DELETE` |
| **Conductor** | `Conductor` | `/api/conductores` | `CONDUCTOR_READ`, `CONDUCTOR_CREATE`, `CONDUCTOR_UPDATE`, `CONDUCTOR_DELETE` |
| **Bus** | `Bus` | `/api/buses` | `BUS_READ`, `BUS_CREATE`, `BUS_UPDATE`, `BUS_DELETE` |
| **Alerta** | `Alerta` | `/api/alertas` | `ALERTA_READ`, `ALERTA_CREATE`, `ALERTA_UPDATE`, `ALERTA_DELETE` |

---

## 🔒 Patrones Destacados

### 1. Bloqueo Pesimista en Flota de Buses
Para garantizar la consistencia en modificaciones concurrentes del estado de un bus o asignaciones de flota, `BusRepository` implementa bloqueo exclusivo a nivel de base de datos:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT b FROM Bus b WHERE b.id = :id")
Optional<Bus> findByIdForUpdate(@Param("id") Long id);
```

### 2. Consulta con JOINs en Monitoreo de Alertas
`AlertaRepository` optimiza la consulta de incidentes en curso vinculando en un solo viaje a base de datos la información del bus, la ruta y la estación mediante proyección DTO directa (`AlertaDetalleResponse`):
```java
@Query("SELECT new com.roles.usermanagement.modules.alerta.AlertaDetalleResponse(" +
       "a.id, a.tipo, a.nivelPrioridad, a.fechaHora, a.resuelta, " +
       "b.placa, r.codigo, r.nombre, e.nombre) " +
       "FROM Alerta a " +
       "JOIN a.bus b " +
       "JOIN b.ruta r " +
       "LEFT JOIN a.estacion e " +
       "WHERE a.resuelta = false")
List<AlertaDetalleResponse> findAlertasActivasConJoin();
```
