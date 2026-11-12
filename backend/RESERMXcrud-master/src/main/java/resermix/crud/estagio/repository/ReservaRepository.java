package resermix.crud.estagio.repository;

import resermix.crud.estagio.entity.Reserva;
import resermix.crud.estagio.entity.StatusReserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    // Reservas de um usuário específico (ex: "minhas reservas" do professor)
    List<Reserva> findByUsuarioIdOrderByDataDescHorarioInicioDesc(Long usuarioId);

    // Reservas de uma sala específica
    List<Reserva> findBySalaIdOrderByDataDescHorarioInicioDesc(Long salaId);

    /**
     * Reservas ainda não canceladas, a partir de uma data, de uma sala ou de
     * um usuário. Usadas para cancelar as reservas futuras quando uma sala ou
     * um usuário é excluído (desativado). As reservas passadas são mantidas
     * como estão, preservando o histórico.
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.sala.id = :salaId
              AND r.data >= :aPartirDe
              AND r.status <> resermix.crud.estagio.entity.StatusReserva.CANCELADA
            """)
    List<Reserva> buscarFuturasDaSala(@Param("salaId") Long salaId,
                                      @Param("aPartirDe") LocalDate aPartirDe);

    @Query("""
            SELECT r FROM Reserva r
            WHERE r.usuario.id = :usuarioId
              AND r.data >= :aPartirDe
              AND r.status <> resermix.crud.estagio.entity.StatusReserva.CANCELADA
            """)
    List<Reserva> buscarFuturasDoUsuario(@Param("usuarioId") Long usuarioId,
                                         @Param("aPartirDe") LocalDate aPartirDe);

    // Reservas em uma data específica
    List<Reserva> findByData(LocalDate data);

    /**
     * Verifica se existe alguma reserva NÃO cancelada da mesma sala, na
     * mesma data, cujo intervalo de horário se sobreponha ao informado.
     *
     * Regra de sobreposição: duas reservas conflitam quando
     * (inicioExistente < fimNovo) E (fimExistente > inicioNovo).
     * Horários consecutivos (ex: 08:00-10:00 e 10:00-12:00) NÃO conflitam,
     * pois a condição usa comparação estrita (< / >).
     *
     * O parâmetro "reservaIdExcluir" permite ignorar a própria reserva ao
     * validar uma edição (pode ser null ao criar uma reserva nova).
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.sala.id = :salaId
              AND r.data = :data
              AND r.status <> resermix.crud.estagio.entity.StatusReserva.CANCELADA
              AND r.horarioInicio < :horarioFim
              AND r.horarioFim > :horarioInicio
              AND (:reservaIdExcluir IS NULL OR r.id <> :reservaIdExcluir)
            """)
    List<Reserva> buscarConflitos(@Param("salaId") Long salaId,
                                   @Param("data") LocalDate data,
                                   @Param("horarioInicio") LocalTime horarioInicio,
                                   @Param("horarioFim") LocalTime horarioFim,
                                   @Param("reservaIdExcluir") Long reservaIdExcluir);

    /**
     * Consulta usada pelo histórico de reservas (suc_gerenciar_historico).
     * Todos os filtros são opcionais: quando um parâmetro é null, a
     * respectiva condição é ignorada, permitindo tanto um histórico geral
     * quanto consultas filtradas por usuário, sala, status e/ou período.
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE (:usuarioId IS NULL OR r.usuario.id = :usuarioId)
              AND (:salaId IS NULL OR r.sala.id = :salaId)
              AND (:status IS NULL OR r.status = :status)
              AND (:dataInicio IS NULL OR r.data >= :dataInicio)
              AND (:dataFim IS NULL OR r.data <= :dataFim)
            ORDER BY r.data DESC, r.horarioInicio DESC
            """)
    List<Reserva> buscarHistorico(@Param("usuarioId") Long usuarioId,
                                   @Param("salaId") Long salaId,
                                   @Param("status") StatusReserva status,
                                   @Param("dataInicio") LocalDate dataInicio,
                                   @Param("dataFim") LocalDate dataFim);
}
