package com.roles.usermanagement.modules.ruta;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface RutaRepository extends JpaRepository<Ruta, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Ruta e WHERE e.id = :id")
    Optional<Ruta> findForUpdate(@Param("id") Long id);

    Optional<Ruta> findByCodigo(String codigo);

    boolean existsByCodigo(String codigo);

    boolean existsByCodigoAndIdNot(String codigo, Long id);
}
