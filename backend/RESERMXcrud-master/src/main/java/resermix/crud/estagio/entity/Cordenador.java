package resermix.crud.estagio.entity;
 
import jakarta.persistence.*;
 
@Entity
@Table(name = "cordenador")
@DiscriminatorValue("CORDENADOR")
public class Cordenador extends Usuario {
 
   
 
    public void cadastrarSala() {
       
    }
 
    public void editarSala() {
       
    }
 
    public void bloquearSala() {
        
    }
 
    public void editarUsuario() {
        
    }
 
    public void bloquearUsuario() {
       
    }
}
 