package resermix.crud.estagio.repository;
 
import resermix.crud.estagio.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {

    // Salas ativas (não excluídas). "ativo IS NULL" cobre salas antigas.
    @Query("SELECT s FROM Sala s WHERE s.ativo = true OR s.ativo IS NULL ORDER BY s.name")
    List<Sala> buscarAtivas();

    // Salas ativas e liberadas para reserva
    @Query("SELECT s FROM Sala s WHERE s.disponivel = true AND (s.ativo = true OR s.ativo IS NULL) ORDER BY s.name")
    List<Sala> buscarDisponiveis();

    /**
     * Salas liberadas pelo coordenador E sem nenhuma reserva ativa (não
     * cancelada) que se sobreponha à data/horário informados. Usa a mesma
     * regra de sobreposição de ReservaRepository.buscarConflitos, então
     * horários consecutivos (08:00-10:00 e 10:00-12:00) não conflitam.
     */
    @Query("""
            SELECT s FROM Sala s
            WHERE s.disponivel = true
              AND (s.ativo = true OR s.ativo IS NULL)
              AND NOT EXISTS (
                SELECT r FROM Reserva r
                WHERE r.sala = s
                  AND r.data = :data
                  AND r.status <> resermix.crud.estagio.entity.StatusReserva.CANCELADA
                  AND r.horarioInicio < :horarioFim
                  AND r.horarioFim > :horarioInicio
              )
            ORDER BY s.name
            """)
    List<Sala> buscarDisponiveisNoPeriodo(@Param("data") LocalDate data,
                                          @Param("horarioInicio") LocalTime horarioInicio,
                                          @Param("horarioFim") LocalTime horarioFim);
}
 