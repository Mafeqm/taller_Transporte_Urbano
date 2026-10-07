package com.roles.usermanagement.modules.bus;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transporte_bus")
@Getter
@Setter
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String placa;

    @Column(nullable = false, length = 50)
    private String modelo;

    @Column(nullable = false)
    private Integer capacidad;

    @Column(nullable = false, length = 30)
    private String estado = "OPERATIVO"; // OPERATIVO, MANTENIMIENTO, INACTIVO

    @Column(nullable = false)
    private boolean activo = true;
}
