package com.roles.usermanagement.modules.alerta;

import com.roles.usermanagement.modules.bus.Bus;
import com.roles.usermanagement.modules.ruta.Ruta;
import com.roles.usermanagement.modules.estacion.Estacion;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "transporte_alerta")
@Getter
@Setter
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String tipo; // ej. FALLA_MECANICA, ACCIDENTE, RETRASO, EMERGENCIA

    @Column(nullable = false, length = 500)
    private String descripcion;

    @Column(nullable = false, length = 20)
    private String severidad; // ALTA, MEDIA, BAJA

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora = LocalDateTime.now();

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "registrado_por", nullable = false, length = 50)
    private String registradoPor;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ruta_id")
    private Ruta ruta;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "estacion_id")
    private Estacion estacion;
}
