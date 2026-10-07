package com.roles.usermanagement.modules.bus;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController
@RequestMapping("/api/buses")
@Tag(name = "Buses")
@SecurityRequirement(name = "bearerAuth")
public class BusController {

    private final BusService service;

    public BusController(BusService service) {
        this.service = service;
    }

    @Operation(summary = "Listar buses", description = "Paginación: page desde 0; size entre 1 y 100.")
    @GetMapping
    @PreAuthorize("hasAuthority('BUS_READ')")
    public Page<BusResponse> all(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.all(page, size);
    }

    @Operation(summary = "Consultar detalle de un bus")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('BUS_READ')")
    public BusResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Crear registro de bus")
    @PostMapping
    @PreAuthorize("hasAuthority('BUS_CREATE')")
    public ResponseEntity<BusResponse> create(@Valid @RequestBody BusRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @Operation(summary = "Actualizar bus", description = "Reemplaza los campos editables; requiere registro activo.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('BUS_UPDATE')")
    public BusResponse update(@PathVariable Long id, @Valid @RequestBody BusRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Desactivar bus", description = "Marca el bus como inactivo; no lo elimina físicamente.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('BUS_DELETE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
