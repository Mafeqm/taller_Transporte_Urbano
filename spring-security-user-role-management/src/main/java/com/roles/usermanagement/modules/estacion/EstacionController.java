package com.roles.usermanagement.modules.estacion;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/estaciones")
@Tag(name = "Estaciones")
@SecurityRequirement(name = "bearerAuth")
public class EstacionController {

    private final EstacionService service;

    public EstacionController(EstacionService service) {
        this.service = service;
    }

    @Operation(summary = "Listar estaciones", description = "Paginación: page desde 0; size entre 1 y 100.")
    @GetMapping
    @PreAuthorize("hasAuthority('ESTACION_READ')")
    public Page<EstacionResponse> all(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.all(page, size);
    }

    @Operation(summary = "Consultar detalle de una estación")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTACION_READ')")
    public EstacionResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear registro de estación")
    @PostMapping
    @PreAuthorize("hasAuthority('ESTACION_CREATE')")
    public ResponseEntity<EstacionResponse> create(@Valid @RequestBody EstacionRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Actualizar estación", description = "Reemplaza los campos editables; requiere registro activo.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTACION_UPDATE')")
    public EstacionResponse update(@PathVariable Long id, @Valid @RequestBody EstacionRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Desactivar estación", description = "Marca la estación como inactiva; no la elimina físicamente.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ESTACION_DELETE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
