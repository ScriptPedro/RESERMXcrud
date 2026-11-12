package resermix.crud.estagio.entity;

/**
 * Representa o ciclo de vida de uma reserva, conforme o diagrama de estado
 * do relatório de estágio (Figura 16 - Diagrama de Estado - Reserva).
 *
 * Fluxo: PENDENTE -> CONFIRMADA -> EM_ANDAMENTO -> FINALIZADA
 *                        \-> CANCELADA
 *
 * Observação: como o sistema não possui um caso de uso de "aprovação" de
 * reserva por um coordenador, ao criar uma reserva sem conflitos de horário
 * ela já nasce CONFIRMADA. O estado PENDENTE é mantido no enum por
 * fidelidade ao diagrama de estado e para suportar uma futura evolução
 * (ex: fluxo de aprovação). As transições automáticas para EM_ANDAMENTO e
 * FINALIZADA (baseadas no horário atual) ficam como trabalho futuro, assim
 * como já indicado no próprio relatório.
 */
public enum StatusReserva {
    PENDENTE,
    CONFIRMADA,
    EM_ANDAMENTO,
    FINALIZADA,
    CANCELADA
}
