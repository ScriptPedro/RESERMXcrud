package resermix.crud.estagio.repository;
 
import resermix.crud.estagio.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
 
    // Busca usuário pelo e-mail (útil para login/validação)
    Optional<Usuario> findByEmail(String email);
 
    // Verifica se já existe um e-mail cadastrado
    boolean existsByEmail(String email);

    // Usuários ativos (não excluídos). "ativo IS NULL" cobre usuários antigos.
    @Query("SELECT u FROM Usuario u WHERE u.ativo = true OR u.ativo IS NULL ORDER BY u.name")
    List<Usuario> buscarAtivos();
}
 