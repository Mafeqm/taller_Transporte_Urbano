package com.roles.usermanagement.modules.conductor;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/conductores")
@Tag(name = "Conductores")
@SecurityRequirement(name = "bearerAuth")
public class ConductorController {

    private final ConductorService service;

    public ConductorController(ConductorService service) {
        this.service = service;
    }

    @Operation(summary = "Listar conductores", description = "Paginación: page desde 0; size entre 1 y 100.")
    @GetMapping
    @PreAuthorize("hasAuthority('CONDUCTOR_READ')")
    public Page<ConductorResponse> all(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.all(page, size);
    }

    @Operation(summary = "Consultar detalle de un conductor")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CONDUCTOR_READ')")
    public ConductorResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear registro de conductor")
    @PostMapping
    @PreAuthorize("hasAuthority('CONDUCTOR_CREATE')")
    public ResponseEntity<ConductorResponse> create(@Valid @RequestBody ConductorRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Actualizar conductor", description = "Reemplaza los campos editables; requiere registro activo.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CONDUCTOR_UPDATE')")
    public ConductorResponse update(@PathVariable Long id, @Valid @RequestBody ConductorRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Desactivar conductor", description = "Marca el conductor como inactivo; no lo elimina físicamente.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CONDUCTOR_DELETE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
