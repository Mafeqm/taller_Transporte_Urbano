package com.roles.usermanagement.modules.ruta;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/rutas")
@Tag(name = "Rutas")
@SecurityRequirement(name = "bearerAuth")
public class RutaController {

    private final RutaService service;

    public RutaController(RutaService service) {
        this.service = service;
    }

    @Operation(summary = "Listar rutas", description = "Paginación: page desde 0; size entre 1 y 100.")
    @GetMapping
    @PreAuthorize("hasAuthority('RUTA_READ')")
    public Page<RutaResponse> all(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.all(page, size);
    }

    @Operation(summary = "Consultar detalle de una ruta")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('RUTA_READ')")
    public RutaResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear registro de ruta")
    @PostMapping
    @PreAuthorize("hasAuthority('RUTA_CREATE')")
    public ResponseEntity<RutaResponse> create(@Valid @RequestBody RutaRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Actualizar ruta", description = "Reemplaza los campos editables; requiere registro activo.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('RUTA_UPDATE')")
    public RutaResponse update(@PathVariable Long id, @Valid @RequestBody RutaRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Desactivar ruta", description = "Marca la ruta como inactiva; no la elimina físicamente.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('RUTA_DELETE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
