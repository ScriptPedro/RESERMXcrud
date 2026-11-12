package resermix.crud.estagio.entity;
 
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
 
@Entity
@Table(name = "sala")
public class Sala {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    @NotBlank(message = "O nome da sala é obrigatório.")
    private String name;
 
    @NotNull(message = "A capacidade é obrigatória.")
    @Min(value = 1, message = "A capacidade deve ser um número positivo maior que zero.")
    private Integer capacidade;

    // Campus/unidade onde a sala fica. Usado para filtrar a lista na tela de reserva.
    // Pode ser nulo nas salas cadastradas antes desta funcionalidade.
    private String campus;
 
    private Boolean disponivel;

    // ─── Recursos (tecnologias) da sala ──────────────────────────────────────────
    // Tipos "wrapper" (Integer/Boolean) aceitam NULL: as salas cadastradas antes
    // desta funcionalidade não têm valor nas colunas novas e continuam funcionando
    // (os getters devolvem 0 / false quando o valor é nulo).

    @Min(value = 0, message = "A quantidade de TVs não pode ser negativa.")
    private Integer tvs;

    @Min(value = 0, message = "A quantidade de computadores não pode ser negativa.")
    private Integer computadores;

    private Boolean arCondicionado;

    private Boolean dataShow;

    // ─── Exclusão lógica (soft delete) ──────────────────────────────────────────
    // Ao "excluir" uma sala ela NÃO é apagada do banco: apenas fica inativa.
    // Assim o histórico de reservas que aponta para ela continua íntegro.
    // Salas antigas (coluna nula) são tratadas como ativas.
    private Boolean ativo = true;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
 
    public Integer getCapacidade() { return capacidade; }
    public void setCapacidade(Integer capacidade) { this.capacidade = capacidade; }
 
    public String getCampus() { return campus; }
    public void setCampus(String campus) {
        // Guarda sem espaços sobrando e trata texto vazio como "sem campus"
        this.campus = (campus == null || campus.isBlank()) ? null : campus.trim();
    }
 
    public Boolean getDisponivel() { return disponivel; }
    public void setDisponivel(Boolean disponivel) { this.disponivel = disponivel; }

    public Integer getTvs() { return tvs != null ? tvs : 0; }
    public void setTvs(Integer tvs) { this.tvs = tvs; }

    public Integer getComputadores() { return computadores != null ? computadores : 0; }
    public void setComputadores(Integer computadores) { this.computadores = computadores; }

    public Boolean getArCondicionado() { return arCondicionado != null && arCondicionado; }
    public void setArCondicionado(Boolean arCondicionado) { this.arCondicionado = arCondicionado; }

    public Boolean getDataShow() { return dataShow != null && dataShow; }
    public void setDataShow(Boolean dataShow) { this.dataShow = dataShow; }

    public Boolean getAtivo() { return ativo == null || ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }

    // ─── Métodos de negócio (conforme diagrama de classe) ────────────────────────
 
    /**
     * Verifica se a sala está disponível para reserva.
     * @return true se disponível, false caso contrário.
     */
    public Boolean verificarDisponibilidade() {
        return getAtivo() && this.disponivel != null && this.disponivel;
    }
 
    /**
     * Altera o status de disponibilidade da sala.
     * @param disponivel novo status.
     */
    public void alterarStatus(Boolean disponivel) {
        this.disponivel = disponivel;
    }
}