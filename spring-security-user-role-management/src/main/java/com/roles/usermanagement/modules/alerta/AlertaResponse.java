package com.roles.usermanagement.modules.alerta;

import java.time.LocalDateTime;

public record AlertaResponse(
    Long id,
    String tipo,
    String descripcion,
    String severidad,
    LocalDateTime fechaHora,
    boolean activo,
    String registradoPor,
    Long busId,
    String busPlaca,
    Long rutaId,
    String rutaCodigo,
    Long estacionId,
    String estacionNombre
) {}
