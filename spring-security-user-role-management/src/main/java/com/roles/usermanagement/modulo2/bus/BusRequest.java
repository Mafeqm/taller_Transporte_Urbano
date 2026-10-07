package com.roles.usermanagement.modulo2.bus;

import jakarta.validation.constraints.*;

public record BusRequest(
    @NotBlank @Size(max = 10) String placa,
    @NotBlank @Size(max = 50) String modelo,
    @NotNull @Min(1) @Max(300) Integer capacidad,
    @Size(max = 30) String estado
) {}
