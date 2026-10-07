package com.roles.usermanagement.modules.ruta;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transporte_ruta")
@Getter
@Setter
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 250)
    private String descripcion;

    @Column(nullable = false)
    private boolean activo = true;
}
