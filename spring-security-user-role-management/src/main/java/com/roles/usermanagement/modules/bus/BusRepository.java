package com.roles.usermanagement.modules.bus;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface BusRepository extends JpaRepository<Bus, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Bus e WHERE e.id = :id")
    Optional<Bus> findForUpdate(@Param("id") Long id);

    Optional<Bus> findByPlaca(String placa);

    boolean existsByPlaca(String placa);

    boolean existsByPlacaAndIdNot(String placa, Long id);
}
