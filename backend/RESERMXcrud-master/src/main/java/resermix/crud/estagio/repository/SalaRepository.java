package resermix.crud.estagio.repository;
 
import resermix.crud.estagio.entity.Sala;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface SalaRepository extends JpaRepository<Sala, Long> {
 
    // Busca todas as salas disponíveis
    List<Sala> findByDisponivelTrue();
}
 