package com.roles.usermanagement.modulo2.bus;

public record BusResponse(
    Long id,
    String placa,
    String modelo,
    Integer capacidad,
    String estado,
    boolean activo
) {}
