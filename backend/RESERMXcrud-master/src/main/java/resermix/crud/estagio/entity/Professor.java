package resermix.crud.estagio.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "professor")
@DiscriminatorValue("PROFESSOR")
public class Professor extends Usuario {
 
    
 
    public void realizarReserva() {
       
    }
 
    public void consultarHistorico() {
      
    }
 
    public void visualizarDashboard() {
       
    }
}
 














