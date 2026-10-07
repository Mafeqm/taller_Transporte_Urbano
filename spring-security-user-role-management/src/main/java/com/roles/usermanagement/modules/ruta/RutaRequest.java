package com.roles.usermanagement.modules.ruta;

import jakarta.validation.constraints.*;

public record RutaRequest(
    @NotBlank @Size(max = 50) String codigo,
    @NotBlank @Size(max = 150) String nombre,
    @Size(max = 250) String descripcion
) {}
