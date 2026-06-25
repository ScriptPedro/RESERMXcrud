package resermix.crud.estagio.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "sala")
public class Sala {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
 
    private String name;
    private Integer capacidade;
    private Boolean disponivel;
 
  
 
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
 
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
 
    public Integer getCapacidade() { return capacidade; }
    public void setCapacidade(Integer capacidade) { this.capacidade = capacidade; }
 
    public Boolean getDisponivel() { return disponivel; }
    public void setDisponivel(Boolean disponivel) { this.disponivel = disponivel; }
 
    // ─── Métodos de negócio (conforme diagrama de classe) ────────────────────────
 
    /**
     * Verifica se a sala está disponível para reserva.
     * @return true se disponível, false caso contrário.
     */
    public Boolean verificarDisponibilidade() {
        return this.disponivel != null && this.disponivel;
    }
 
    /**
     * Altera o status de disponibilidade da sala.
     * @param disponivel novo status.
     */
    public void alterarStatus(Boolean disponivel) {
        this.disponivel = disponivel;
    }
}