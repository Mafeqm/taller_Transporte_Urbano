package com.roles.usermanagement.modules.estacion;

import jakarta.validation.constraints.*;

public record EstacionRequest(
    @NotBlank @Size(max = 150) String nombre,
    @Size(max = 200) String ubicacion
) {}
