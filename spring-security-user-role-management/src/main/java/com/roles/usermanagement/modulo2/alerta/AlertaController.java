package com.roles.usermanagement.modulo2.alerta;

import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import java.util.List;

@RestController
@RequestMapping("/api/alertas")
@Tag(name = "Alertas e Incidentes")
@SecurityRequirement(name = "bearerAuth")
public class AlertaController {

    private final AlertaService service;

    public AlertaController(AlertaService service) {
        this.service = service;
    }

    @Operation(summary = "Listar todas las alertas", description = "Paginación: page desde 0; size entre 1 y 100.")
    @GetMapping
    @PreAuthorize("hasAuthority('ALERTA_READ')")
    public Page<AlertaResponse> all(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.all(page, size);
    }

    @Operation(summary = "Listar alertas activas con JOINs (Tarea clave Sergio)", description = "Devuelve las alertas activas con datos consolidados de buses, rutas y estaciones.")
    @GetMapping("/activas")
    @PreAuthorize("hasAuthority('ALERTA_READ')")
    public List<AlertaDetalleResponse> activas() {
        return service.listarActivasConJoin();
    }

    @Operation(summary = "Consultar detalle de una alerta")
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ALERTA_READ')")
    public AlertaResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @Operation(summary = "Registrar nuevo incidente / alerta")
    @PostMapping
    @PreAuthorize("hasAuthority('ALERTA_CREATE')")
    public ResponseEntity<AlertaResponse> create(@Valid @RequestBody AlertaRequest dto, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonimo";
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto, username));
    }

    @Operation(summary = "Actualizar alerta o incidente", description = "Reemplaza los campos de la alerta si aún está activa.")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ALERTA_UPDATE')")
    public AlertaResponse update(@PathVariable Long id, @Valid @RequestBody AlertaRequest dto) {
        return service.update(id, dto);
    }

    @Operation(summary = "Desactivar / resolver alerta", description = "Marca la alerta o incidente como inactivo/resuelto.")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ALERTA_DELETE')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
