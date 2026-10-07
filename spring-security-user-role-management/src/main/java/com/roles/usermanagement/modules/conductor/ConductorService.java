package com.roles.usermanagement.modules.conductor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional
public class ConductorService {

    private final ConductorRepository repository;

    public ConductorService(ConductorRepository repository) {
        this.repository = repository;
    }

    private Conductor existing(Long id, boolean lock) {
        return (lock ? repository.findForUpdate(id) : repository.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conductor no encontrado"));
    }

    private ConductorResponse dto(Conductor e) {
        return new ConductorResponse(e.getId(), e.getNombre(), e.getCedula(), e.getLicencia(), e.getTelefono(), e.isActivo());
    }

    @Transactional(readOnly = true)
    public Page<ConductorResponse> all(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0; size entre 1 y 100");
        }
        return repository.findAll(PageRequest.of(page, size, Sort.by("id"))).map(this::dto);
    }

    @Transactional(readOnly = true)
    public ConductorResponse get(Long id) {
        return dto(existing(id, false));
    }

    public ConductorResponse create(ConductorRequest d) {
        String cedula = d.cedula().trim();
        if (repository.existsByCedula(cedula)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un conductor con la cédula " + cedula);
        }
        Conductor e = new Conductor();
        e.setNombre(d.nombre().trim());
        e.setCedula(cedula);
        e.setLicencia(d.licencia().trim());
        e.setTelefono(d.telefono() != null ? d.telefono().trim() : null);
        return dto(repository.save(e));
    }

    public ConductorResponse update(Long id, ConductorRequest d) {
        Conductor e = existing(id, true);
        if (!e.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conductor inactivo");
        }
        String cedula = d.cedula().trim();
        if (repository.existsByCedulaAndIdNot(cedula, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro conductor con la cédula " + cedula);
        }
        e.setNombre(d.nombre().trim());
        e.setCedula(cedula);
        e.setLicencia(d.licencia().trim());
        e.setTelefono(d.telefono() != null ? d.telefono().trim() : null);
        return dto(e);
    }

    public void deactivate(Long id) {
        existing(id, true).setActivo(false);
    }
}
