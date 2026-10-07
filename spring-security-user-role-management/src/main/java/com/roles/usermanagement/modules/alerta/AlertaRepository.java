package com.roles.usermanagement.modules.alerta;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Alerta a WHERE a.id = :id")
    Optional<Alerta> findForUpdate(@Param("id") Long id);

    /**
     * TAREA CLAVE PARA SERGIO:
     * Consulta con @Query para traer las alertas activas realizando los JOINs
     * hacia buses, rutas y estaciones, mapeado directamente al DTO AlertaDetalleResponse.
     */
    @Query("""
        SELECT new com.roles.usermanagement.modules.alerta.AlertaDetalleResponse(
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

    /**
     * Consulta SQL nativa alternativa con JOINs explícitos entre las tablas relacionales.
     */
    @Query(value = """
        SELECT a.id,
               a.tipo,
               a.descripcion,
               a.severidad,
               a.fecha_hora,
               a.activo,
               a.registrado_por,
               b.id AS bus_id,
               b.placa AS bus_placa,
               b.modelo AS bus_modelo,
               r.id AS ruta_id,
               r.codigo AS ruta_codigo,
               r.nombre AS ruta_nombre,
               e.id AS estacion_id,
               e.nombre AS estacion_nombre
        FROM transporte_alerta a
        INNER JOIN transporte_bus b ON a.bus_id = b.id
        LEFT JOIN transporte_ruta r ON a.ruta_id = r.id
        LEFT JOIN transporte_estacion e ON a.estacion_id = e.id
        WHERE a.activo = true
        ORDER BY a.fecha_hora DESC
    """, nativeQuery = true)
    List<Object[]> findAlertasActivasNativeSQL();

    /**
     * Consulta JPQL con JOIN FETCH para traer la entidad completa hidratada.
     */
    @Query("""
        SELECT a FROM Alerta a
        JOIN FETCH a.bus b
        LEFT JOIN FETCH a.ruta r
        LEFT JOIN FETCH a.estacion e
        WHERE a.activo = true
        ORDER BY a.fechaHora DESC
    """)
    List<Alerta> findAlertasActivasEntidades();

    List<Alerta> findByActivoTrueOrderByFechaHoraDesc();
}
