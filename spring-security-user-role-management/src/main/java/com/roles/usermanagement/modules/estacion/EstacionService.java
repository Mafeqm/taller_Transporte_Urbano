package com.roles.usermanagement.modules.estacion;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional
public class EstacionService {

    private final EstacionRepository repository;

    public EstacionService(EstacionRepository repository) {
        this.repository = repository;
    }

    private Estacion existing(Long id, boolean lock) {
        return (lock ? repository.findForUpdate(id) : repository.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Estación no encontrada"));
    }

    private EstacionResponse dto(Estacion e) {
        return new EstacionResponse(e.getId(), e.getNombre(), e.getUbicacion(), e.isActivo());
    }

    @Transactional(readOnly = true)
    public Page<EstacionResponse> all(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0; size entre 1 y 100");
        }
        return repository.findAll(PageRequest.of(page, size, Sort.by("id"))).map(this::dto);
    }

    @Transactional(readOnly = true)
    public EstacionResponse get(Long id) {
        return dto(existing(id, false));
    }

    public EstacionResponse create(EstacionRequest d) {
        String nombre = d.nombre().trim();
        if (repository.existsByNombre(nombre)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una estación con el nombre " + nombre);
        }
        Estacion e = new Estacion();
        e.setNombre(nombre);
        e.setUbicacion(d.ubicacion() != null ? d.ubicacion().trim() : null);
        return dto(repository.save(e));
    }

    public EstacionResponse update(Long id, EstacionRequest d) {
        Estacion e = existing(id, true);
        if (!e.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Estación inactiva");
        }
        String nombre = d.nombre().trim();
        if (repository.existsByNombreAndIdNot(nombre, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otra estación con el nombre " + nombre);
        }
        e.setNombre(nombre);
        e.setUbicacion(d.ubicacion() != null ? d.ubicacion().trim() : null);
        return dto(e);
    }

    public void deactivate(Long id) {
        existing(id, true).setActivo(false);
    }
}
