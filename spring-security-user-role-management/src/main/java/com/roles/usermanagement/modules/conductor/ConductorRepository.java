package com.roles.usermanagement.modules.conductor;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface ConductorRepository extends JpaRepository<Conductor, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Conductor e WHERE e.id = :id")
    Optional<Conductor> findForUpdate(@Param("id") Long id);

    Optional<Conductor> findByCedula(String cedula);

    boolean existsByCedula(String cedula);

    boolean existsByCedulaAndIdNot(String cedula, Long id);
}
