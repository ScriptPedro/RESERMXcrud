package resermix.crud.estagio.controller;
 
import resermix.crud.estagio.entity.Sala;
import resermix.crud.estagio.repository.SalaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
 
@RestController
@RequestMapping("/salas")
public class SalaController {
 
    @Autowired
    private SalaRepository salaRepository;
 
    // ─── CREATE ──────────────────────────────────────────────────────────────────
 
    @PostMapping
    public ResponseEntity<Sala> cadastrarSala(@RequestBody Sala sala) {
        // Nova sala começa disponível por padrão
        if (sala.getDisponivel() == null) {
            sala.setDisponivel(true);
        }
        Sala salva = salaRepository.save(sala);
        return ResponseEntity.ok(salva);
    }
 
    // ─── READ ─────────────────────────────────────────────────────────────────────
 
    @GetMapping
    public List<Sala> listarSalas() {
        return salaRepository.findAll();
    }
 
    @GetMapping("/{id}")
    public ResponseEntity<Sala> buscarSala(@PathVariable Long id) {
        return salaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
 
    @GetMapping("/disponiveis")
    public List<Sala> listarSalasDisponiveis() {
        return salaRepository.findByDisponivelTrue();
    }
 
    // ─── UPDATE ───────────────────────────────────────────────────────────────────
 
    @PutMapping("/{id}")
    public ResponseEntity<Sala> editarSala(@PathVariable Long id, @RequestBody Sala salaAtualizada) {
        return salaRepository.findById(id).map(sala -> {
            sala.setName(salaAtualizada.getName());
            sala.setCapacidade(salaAtualizada.getCapacidade());
            sala.setDisponivel(salaAtualizada.getDisponivel());
            return ResponseEntity.ok(salaRepository.save(sala));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    // ─── Alterar status (bloquearSala / liberarSala) ──────────────────────────────
 
    @PatchMapping("/{id}/status")
    public ResponseEntity<Sala> alterarStatus(@PathVariable Long id,
                                               @RequestParam Boolean disponivel) {
        return salaRepository.findById(id).map(sala -> {
            sala.alterarStatus(disponivel);
            return ResponseEntity.ok(salaRepository.save(sala));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    // ─── DELETE ───────────────────────────────────────────────────────────────────
 
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarSala(@PathVariable Long id) {
        if (!salaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        salaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}