package com.roles.usermanagement.modulo2.alerta;

import java.time.LocalDateTime;

public record AlertaDetalleResponse(
    Long id,
    String tipo,
    String descripcion,
    String severidad,
    LocalDateTime fechaHora,
    boolean activo,
    String registradoPor,
    Long busId,
    String busPlaca,
    String busModelo,
    Long rutaId,
    String rutaCodigo,
    String rutaNombre,
    Long estacionId,
    String estacionNombre
) {}
