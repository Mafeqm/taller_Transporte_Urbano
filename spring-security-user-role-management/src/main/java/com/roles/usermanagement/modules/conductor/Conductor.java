package com.roles.usermanagement.modules.conductor;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transporte_conductor")
@Getter
@Setter
public class Conductor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String cedula;

    @Column(nullable = false, length = 30)
    private String licencia;

    @Column(length = 30)
    private String telefono;

    @Column(nullable = false)
    private boolean activo = true;
}
