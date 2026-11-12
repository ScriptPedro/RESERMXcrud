package resermix.crud.estagio.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Representa uma reserva de sala, conforme o DER e o diagrama de classe do
 * relatório de estágio. Cada reserva pertence a um único Usuario e a uma
 * única Sala; um Usuario e uma Sala podem estar associados a várias
 * reservas ao longo do tempo (Usuario 1--0..* Reserva, Sala 1--0..* Reserva).
 *
 * O "histórico de reservas" (suc_gerenciar_historico) não é uma entidade
 * separada: é obtido consultando os registros desta própria tabela.
 */
@Entity
@Table(name = "reserva")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "A data da reserva é obrigatória.")
    private LocalDate data;

    @NotNull(message = "O horário inicial é obrigatório.")
    private LocalTime horarioInicio;

    @NotNull(message = "O horário final é obrigatório.")
    private LocalTime horarioFim;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusReserva status;

    private String observacao;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(optional = false)
    @JoinColumn(name = "id_sala", nullable = false)
    private Sala sala;

    // ─── Getters e Setters ────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public LocalTime getHorarioInicio() { return horarioInicio; }
    public void setHorarioInicio(LocalTime horarioInicio) { this.horarioInicio = horarioInicio; }

    public LocalTime getHorarioFim() { return horarioFim; }
    public void setHorarioFim(LocalTime horarioFim) { this.horarioFim = horarioFim; }

    public StatusReserva getStatus() { return status; }
    public void setStatus(StatusReserva status) { this.status = status; }

    public String getObservacao() { return observacao; }
    public void setObservacao(String observacao) { this.observacao = observacao; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Sala getSala() { return sala; }
    public void setSala(Sala sala) { this.sala = sala; }

    // ─── Métodos de negócio ───────────────────────────────────────────────

    /**
     * Cancela a reserva, preservando o registro (necessário para a
     * rastreabilidade exigida pelo caso de uso suc_gerenciar_historico).
     */
    public void cancelar() {
        this.status = StatusReserva.CANCELADA;
    }
}
