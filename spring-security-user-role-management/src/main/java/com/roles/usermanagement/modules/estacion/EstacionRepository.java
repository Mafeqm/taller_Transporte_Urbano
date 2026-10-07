package com.roles.usermanagement.modules.estacion;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface EstacionRepository extends JpaRepository<Estacion, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Estacion e WHERE e.id = :id")
    Optional<Estacion> findForUpdate(@Param("id") Long id);

    boolean existsByNombre(String nombre);

    boolean existsByNombreAndIdNot(String nombre, Long id);
}
