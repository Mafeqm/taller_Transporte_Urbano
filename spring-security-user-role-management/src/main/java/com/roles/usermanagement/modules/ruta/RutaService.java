package com.roles.usermanagement.modules.ruta;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional
public class RutaService {

    private final RutaRepository repository;

    public RutaService(RutaRepository repository) {
        this.repository = repository;
    }

    private Ruta existing(Long id, boolean lock) {
        return (lock ? repository.findForUpdate(id) : repository.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ruta no encontrada"));
    }

    private RutaResponse dto(Ruta e) {
        return new RutaResponse(e.getId(), e.getCodigo(), e.getNombre(), e.getDescripcion(), e.isActivo());
    }

    @Transactional(readOnly = true)
    public Page<RutaResponse> all(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0; size entre 1 y 100");
        }
        return repository.findAll(PageRequest.of(page, size, Sort.by("id"))).map(this::dto);
    }

    @Transactional(readOnly = true)
    public RutaResponse get(Long id) {
        return dto(existing(id, false));
    }

    public RutaResponse create(RutaRequest d) {
        String codigo = d.codigo().trim().toUpperCase();
        if (repository.existsByCodigo(codigo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una ruta con el código " + codigo);
        }
        Ruta e = new Ruta();
        e.setCodigo(codigo);
        e.setNombre(d.nombre().trim());
        e.setDescripcion(d.descripcion() != null ? d.descripcion().trim() : null);
        return dto(repository.save(e));
    }

    public RutaResponse update(Long id, RutaRequest d) {
        Ruta e = existing(id, true);
        if (!e.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ruta inactiva");
        }
        String codigo = d.codigo().trim().toUpperCase();
        if (repository.existsByCodigoAndIdNot(codigo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otra ruta con el código " + codigo);
        }
        e.setCodigo(codigo);
        e.setNombre(d.nombre().trim());
        e.setDescripcion(d.descripcion() != null ? d.descripcion().trim() : null);
        return dto(e);
    }

    public void deactivate(Long id) {
        existing(id, true).setActivo(false);
    }
}
