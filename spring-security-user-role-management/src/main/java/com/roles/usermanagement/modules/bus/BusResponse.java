package com.roles.usermanagement.modules.bus;

public record BusResponse(
    Long id,
    String placa,
    String modelo,
    Integer capacidad,
    String estado,
    boolean activo
) {}
