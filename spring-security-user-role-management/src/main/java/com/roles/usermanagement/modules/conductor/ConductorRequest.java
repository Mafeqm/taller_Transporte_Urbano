package com.roles.usermanagement.modules.conductor;

import jakarta.validation.constraints.*;

public record ConductorRequest(
    @NotBlank @Size(max = 150) String nombre,
    @NotBlank @Size(max = 20) String cedula,
    @NotBlank @Size(max = 30) String licencia,
    @Size(max = 30) String telefono
) {}
