package resermix.crud.estagio.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO de entrada para criação/edição de reservas.
 *
 * Recebemos apenas os IDs de usuário e sala (em vez da entidade completa)
 * para evitar acoplamento com a serialização polimórfica de Usuario e para
 * deixar explícito, na própria API, quais campos o cliente deve enviar.
 */
public class ReservaRequest {

    /** Horário de funcionamento: reservas só podem acontecer entre 06:00 e 23:00. */
    public static final LocalTime HORARIO_ABERTURA = LocalTime.of(6, 0);
    public static final LocalTime HORARIO_FECHAMENTO = LocalTime.of(23, 0);

    /**
     * Regras de horário compartilhadas pela criação/edição de reservas e pela
     * busca de salas livres. Devolve a mensagem de erro, ou null se estiver tudo certo.
     */
    public static String validarHorario(LocalTime inicio, LocalTime fim) {
        if (!inicio.isBefore(fim)) {
            return "O horário inicial deve ser anterior ao horário final.";
        }
        if (inicio.isBefore(HORARIO_ABERTURA) || fim.isAfter(HORARIO_FECHAMENTO)) {
            return "As reservas só podem ser feitas entre 06:00 e 23:00.";
        }
        return null;
    }

    /**
     * Impede reservas no passado: a data não pode ser anterior a hoje e,
     * se for hoje, o horário inicial não pode já ter passado.
     * Devolve a mensagem de erro, ou null se estiver tudo certo.
     */
    public static String validarData(LocalDate data, LocalTime inicio) {
        LocalDate hoje = LocalDate.now();
        if (data.isBefore(hoje)) {
            return "Não é possível fazer reservas para datas passadas.";
        }
        if (data.isEqual(hoje) && inicio.isBefore(LocalTime.now())) {
            return "O horário inicial já passou. Escolha um horário futuro.";
        }
        return null;
    }

    @NotNull(message = "O usuário responsável pela reserva é obrigatório.")
    private Long usuarioId;

    @NotNull(message = "A sala é obrigatória.")
    private Long salaId;

    @NotNull(message = "A data da reserva é obrigatória.")
    private LocalDate data;

    @NotNull(message = "O horário inicial é obrigatório.")
    private LocalTime horarioInicio;

    @NotNull(message = "O horário final é obrigatório.")
    private LocalTime horarioFim;

    private String observacao;

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public Long getSalaId() { return salaId; }
    public void setSalaId(Long salaId) { this.salaId = salaId; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public LocalTime getHorarioInicio() { return horarioInicio; }
    public void setHorarioInicio(LocalTime horarioInicio) { this.horarioInicio = horarioInicio; }

    public LocalTime getHorarioFim() { return horarioFim; }
    public void setHorarioFim(LocalTime horarioFim) { this.horarioFim = horarioFim; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }
}
