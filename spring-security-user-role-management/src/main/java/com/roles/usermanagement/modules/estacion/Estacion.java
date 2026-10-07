package com.roles.usermanagement.modules.estacion;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "transporte_estacion")
@Getter
@Setter
public class Estacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 200)
    private String ubicacion;

    @Column(nullable = false)
    private boolean activo = true;
}
