package com.roles.usermanagement.modules.estacion;

public record EstacionResponse(
    Long id,
    String nombre,
    String ubicacion,
    boolean activo
) {}
