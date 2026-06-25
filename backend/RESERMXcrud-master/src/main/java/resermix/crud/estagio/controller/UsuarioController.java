package resermix.crud.estagio.controller;
 
import resermix.crud.estagio.entity.Usuario;
import resermix.crud.estagio.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
 
    @Autowired
    private UsuarioRepository usuarioRepository;
 
    // ─── CREATE ──────────────────────────────────────────────────────────────────
 
    @PostMapping
    public ResponseEntity<?> cadastrarUsuario(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return ResponseEntity.badRequest().body("E-mail já cadastrado.");
        }
        Usuario salvo = usuarioRepository.save(usuario);
        return ResponseEntity.ok(salvo);
    }
 
    // ─── READ ─────────────────────────────────────────────────────────────────────
 
    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }
 
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> buscarUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
 
    // ─── UPDATE ───────────────────────────────────────────────────────────────────
 
    @PutMapping("/{id}")
    public ResponseEntity<?> editarUsuario(@PathVariable Long id, @RequestBody Usuario dadosAtualizados) {
        return usuarioRepository.findById(id).map(usuario -> {
            // Verifica conflito de e-mail com outro usuário
            if (!usuario.getEmail().equals(dadosAtualizados.getEmail())
                    && usuarioRepository.existsByEmail(dadosAtualizados.getEmail())) {
                return ResponseEntity.badRequest().body("E-mail já está em uso.");
            }
            usuario.setName(dadosAtualizados.getName());
            usuario.setEmail(dadosAtualizados.getEmail());
            // Só atualiza senha se for informada
            if (dadosAtualizados.getSenha() != null && !dadosAtualizados.getSenha().isBlank()) {
                usuario.setSenha(dadosAtualizados.getSenha());
            }
            return ResponseEntity.ok(usuarioRepository.save(usuario));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    // ─── DELETE (bloquearUsuario) ─────────────────────────────────────────────────
 
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}