package com.roles.usermanagement.modulo2.alerta;

import jakarta.validation.constraints.*;

public record AlertaRequest(
    @NotBlank(message = "El tipo de alerta es obligatorio")
    @Size(max = 50)
    String tipo,

    @NotBlank(message = "La descripción es obligatoria")
    @Size(max = 500)
    String descripcion,

    @NotBlank(message = "La severidad es obligatoria")
    @Size(max = 20)
    String severidad,

    @NotNull(message = "El ID del bus es obligatorio")
    Long busId,

    Long rutaId,

    Long estacionId
) {}
