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
import java.util.regex.Pattern;
 
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
 
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    // ─── Validações ──────────────────────────────────────────────────────────────

    private static final int TAMANHO_MINIMO_NOME = 3;
    private static final int TAMANHO_MINIMO_SENHA = 6;
    private static final Pattern PADRAO_EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    // Apenas letras (com acentos) e espaços — mesma regra do frontend
    private static final Pattern PADRAO_NOME = Pattern.compile("^[\\p{L} ]+$");

    /**
     * Valida nome, e-mail e senha. Na edição a senha é opcional (em branco =
     * mantém a atual). Devolve a mensagem de erro, ou null se estiver tudo certo.
     */
    private String validarUsuario(Usuario u, boolean senhaObrigatoria) {
        String nome = u.getName() == null ? "" : u.getName().trim();
        if (nome.isEmpty()) {
            return "O nome é obrigatório.";
        }
        if (nome.length() < TAMANHO_MINIMO_NOME) {
            return "O nome deve ter pelo menos " + TAMANHO_MINIMO_NOME + " letras.";
        }
        if (!PADRAO_NOME.matcher(nome).matches()) {
            return "O nome deve conter apenas letras e espaços.";
        }
        String email = u.getEmail() == null ? "" : u.getEmail().trim();
        if (email.isEmpty()) {
            return "O e-mail é obrigatório.";
        }
        if (!PADRAO_EMAIL.matcher(email).matches()) {
            return "Informe um e-mail válido (ex: nome@dominio.com).";
        }
        String senha = u.getSenha();
        boolean senhaInformada = senha != null && !senha.isBlank();
        if (senhaObrigatoria && !senhaInformada) {
            return "A senha é obrigatória.";
        }
        if (senhaInformada && senha.length() < TAMANHO_MINIMO_SENHA) {
            return "A senha deve ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.";
        }
        return null;
    }

    // Padroniza o e-mail (sem espaços e em minúsculas) e o nome (sem espaços sobrando)
    private void normalizar(Usuario u) {
        u.setName(u.getName().trim().replaceAll("\\s+", " "));
        u.setEmail(u.getEmail().trim().toLowerCase());
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────────
 
    @PostMapping
    public ResponseEntity<?> cadastrarUsuario(@RequestBody Usuario usuario) {
        String erro = validarUsuario(usuario, true);
        if (erro != null) {
            return ResponseEntity.badRequest().body(erro);
        }
        normalizar(usuario);
        if (usuarioRepository.existsByEmailIgnoreCase(usuario.getEmail())) {
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
        String erro = validarUsuario(dadosAtualizados, false);
        if (erro != null) {
            return ResponseEntity.badRequest().body(erro);
        }
        normalizar(dadosAtualizados);
        return usuarioRepository.findById(id).filter(Usuario::getAtivo).map(usuario -> {
            // Verifica conflito de e-mail com outro usuário
            if (!usuario.getEmail().equalsIgnoreCase(dadosAtualizados.getEmail())
                    && usuarioRepository.existsByEmailIgnoreCase(dadosAtualizados.getEmail())) {
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