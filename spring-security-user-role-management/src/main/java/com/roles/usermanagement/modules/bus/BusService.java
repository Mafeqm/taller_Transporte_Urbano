package com.roles.usermanagement.modules.bus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional
public class BusService {

    private final BusRepository repository;

    public BusService(BusRepository repository) {
        this.repository = repository;
    }

    private Bus existing(Long id, boolean lock) {
        return (lock ? repository.findForUpdate(id) : repository.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bus no encontrado"));
    }

    private BusResponse dto(Bus e) {
        return new BusResponse(e.getId(), e.getPlaca(), e.getModelo(), e.getCapacidad(), e.getEstado(), e.isActivo());
    }

    @Transactional(readOnly = true)
    public Page<BusResponse> all(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0; size entre 1 y 100");
        }
        return repository.findAll(PageRequest.of(page, size, Sort.by("id"))).map(this::dto);
    }

    @Transactional(readOnly = true)
    public BusResponse get(Long id) {
        return dto(existing(id, false));
    }

    public BusResponse create(BusRequest d) {
        String placa = d.placa().trim().toUpperCase();
        if (repository.existsByPlaca(placa)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un bus con la placa " + placa);
        }
        Bus e = new Bus();
        e.setPlaca(placa);
        e.setModelo(d.modelo().trim());
        e.setCapacidad(d.capacidad());
        if (d.estado() != null && !d.estado().isBlank()) {
            e.setEstado(d.estado().trim().toUpperCase());
        }
        return dto(repository.save(e));
    }

    public BusResponse update(Long id, BusRequest d) {
        Bus e = existing(id, true);
        if (!e.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bus inactivo");
        }
        String placa = d.placa().trim().toUpperCase();
        if (repository.existsByPlacaAndIdNot(placa, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro bus con la placa " + placa);
        }
        e.setPlaca(placa);
        e.setModelo(d.modelo().trim());
        e.setCapacidad(d.capacidad());
        if (d.estado() != null && !d.estado().isBlank()) {
            e.setEstado(d.estado().trim().toUpperCase());
        }
        return dto(e);
    }

    public void deactivate(Long id) {
        existing(id, true).setActivo(false);
    }
}
