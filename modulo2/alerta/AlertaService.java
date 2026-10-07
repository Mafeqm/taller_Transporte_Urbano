package com.roles.usermanagement.modulo2.alerta;

import com.roles.usermanagement.modulo2.bus.Bus;
import com.roles.usermanagement.modulo2.bus.BusRepository;
import com.roles.usermanagement.modules.ruta.Ruta;
import com.roles.usermanagement.modules.ruta.RutaRepository;
import com.roles.usermanagement.modules.estacion.Estacion;
import com.roles.usermanagement.modules.estacion.EstacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class AlertaService {

    private final AlertaRepository alertaRepository;
    private final BusRepository busRepository;
    private final RutaRepository rutaRepository;
    private final EstacionRepository estacionRepository;

    public AlertaService(
        AlertaRepository alertaRepository,
        BusRepository busRepository,
        RutaRepository rutaRepository,
        EstacionRepository estacionRepository
    ) {
        this.alertaRepository = alertaRepository;
        this.busRepository = busRepository;
        this.rutaRepository = rutaRepository;
        this.estacionRepository = estacionRepository;
    }

    private Alerta existing(Long id, boolean lock) {
        return (lock ? alertaRepository.findForUpdate(id) : alertaRepository.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerta no encontrada"));
    }

    private AlertaResponse dto(Alerta a) {
        return new AlertaResponse(
            a.getId(),
            a.getTipo(),
            a.getDescripcion(),
            a.getSeveridad(),
            a.getFechaHora(),
            a.isActivo(),
            a.getRegistradoPor(),
            a.getBus().getId(),
            a.getBus().getPlaca(),
            a.getRuta() != null ? a.getRuta().getId() : null,
            a.getRuta() != null ? a.getRuta().getCodigo() : null,
            a.getEstacion() != null ? a.getEstacion().getId() : null,
            a.getEstacion() != null ? a.getEstacion().getNombre() : null
        );
    }

    /**
     * TAREA CLAVE PARA SERGIO:
     * Registrar una alerta o incidente en el sistema validando las entidades relacionadas.
     */
    public AlertaResponse create(AlertaRequest d, String username) {
        // 1. Validar que el bus exista y esté activo
        Bus bus = busRepository.findById(d.busId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El bus indicado no existe"));
        if (!bus.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede asociar una alerta a un bus inactivo");
        }

        // 2. Validar ruta si fue enviada
        Ruta ruta = null;
        if (d.rutaId() != null) {
            ruta = rutaRepository.findById(d.rutaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La ruta indicada no existe"));
            if (!ruta.isActivo()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La ruta seleccionada está inactiva");
            }
        }

        // 3. Validar estación si fue enviada
        Estacion estacion = null;
        if (d.estacionId() != null) {
            estacion = estacionRepository.findById(d.estacionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La estación indicada no existe"));
            if (!estacion.isActivo()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La estación seleccionada está inactiva");
            }
        }

        // 4. Instanciar y persistir la alerta
        Alerta alerta = new Alerta();
        alerta.setTipo(d.tipo().trim().toUpperCase());
        alerta.setDescripcion(d.descripcion().trim());
        alerta.setSeveridad(d.severidad().trim().toUpperCase());
        alerta.setFechaHora(LocalDateTime.now());
        alerta.setActivo(true);
        alerta.setRegistradoPor(username != null && !username.isBlank() ? username : "sistema");
        alerta.setBus(bus);
        alerta.setRuta(ruta);
        alerta.setEstacion(estacion);

        return dto(alertaRepository.save(alerta));
    }

    /**
     * TAREA CLAVE PARA SERGIO:
     * Listar alertas activas con los JOIN hacia buses, rutas y estaciones.
     */
    @Transactional(readOnly = true)
    public List<AlertaDetalleResponse> listarActivasConJoin() {
        return alertaRepository.findAlertasActivasConJoin();
    }

    @Transactional(readOnly = true)
    public Page<AlertaResponse> all(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "page >= 0; size entre 1 y 100");
        }
        return alertaRepository.findAll(PageRequest.of(page, size, Sort.by("id").descending())).map(this::dto);
    }

    @Transactional(readOnly = true)
    public AlertaResponse get(Long id) {
        return dto(existing(id, false));
    }

    public AlertaResponse update(Long id, AlertaRequest d) {
        Alerta alerta = existing(id, true);
        if (!alerta.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede modificar una alerta inactiva o cerrada");
        }

        Bus bus = busRepository.findById(d.busId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El bus indicado no existe"));
        if (!bus.isActivo()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El bus indicado está inactivo");
        }

        Ruta ruta = null;
        if (d.rutaId() != null) {
            ruta = rutaRepository.findById(d.rutaId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La ruta indicada no existe"));
        }

        Estacion estacion = null;
        if (d.estacionId() != null) {
            estacion = estacionRepository.findById(d.estacionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La estación indicada no existe"));
        }

        alerta.setTipo(d.tipo().trim().toUpperCase());
        alerta.setDescripcion(d.descripcion().trim());
        alerta.setSeveridad(d.severidad().trim().toUpperCase());
        alerta.setBus(bus);
        alerta.setRuta(ruta);
        alerta.setEstacion(estacion);

        return dto(alerta);
    }

    public void deactivate(Long id) {
        existing(id, true).setActivo(false);
    }
}
