package com.roles.usermanagement.modules.conductor;

public record ConductorResponse(
    Long id,
    String nombre,
    String cedula,
    String licencia,
    String telefono,
    boolean activo
) {}
