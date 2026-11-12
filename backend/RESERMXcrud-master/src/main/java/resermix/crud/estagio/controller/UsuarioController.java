package resermix.crud.estagio.controller;
 
import resermix.crud.estagio.entity.Reserva;
import resermix.crud.estagio.entity.Usuario;
import resermix.crud.estagio.repository.ReservaRepository;
import resermix.crud.estagio.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
 
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
 
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    // ─── CREATE ──────────────────────────────────────────────────────────────────
 
    @PostMapping
    public ResponseEntity<?> cadastrarUsuario(@RequestBody Usuario usuario) {
        if (usuarioRepository.existsByEmail(usuario.getEmail())) {
            return ResponseEntity.badRequest().body("E-mail já cadastrado.");
        }
        usuario.setAtivo(true);
        Usuario salvo = usuarioRepository.save(usuario);
        return ResponseEntity.ok(salvo);
    }
 
    // ─── READ ─────────────────────────────────────────────────────────────────────
 
    @GetMapping
    public List<Usuario> listarUsuarios() {
        // Apenas usuários ativos. Como o login do frontend usa esta lista,
        // um usuário excluído (inativo) deixa de conseguir entrar no sistema.
        return usuarioRepository.buscarAtivos();
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
        return usuarioRepository.findById(id).filter(Usuario::getAtivo).map(usuario -> {
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
 
    /**
     * Exclusão LÓGICA: o usuário não é apagado do banco, apenas marcado como
     * inativo (ativo = false). O histórico de reservas feitas por ele é
     * preservado, ele deixa de aparecer nas listagens e não consegue mais
     * fazer login. As reservas futuras ainda ativas dele são canceladas.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id).filter(Usuario::getAtivo).map(usuario -> {
            usuario.setAtivo(false);
            usuarioRepository.save(usuario);

            List<Reserva> futuras = reservaRepository.buscarFuturasDoUsuario(id, LocalDate.now());
            futuras.forEach(Reserva::cancelar);
            reservaRepository.saveAll(futuras);

            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}