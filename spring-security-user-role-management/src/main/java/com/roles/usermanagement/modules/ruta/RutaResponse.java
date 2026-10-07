package com.roles.usermanagement.modules.ruta;

public record RutaResponse(
    Long id,
    String codigo,
    String nombre,
    String descripcion,
    boolean activo
) {}
