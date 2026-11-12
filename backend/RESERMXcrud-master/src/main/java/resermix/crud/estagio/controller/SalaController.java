package resermix.crud.estagio.controller;
 
import resermix.crud.estagio.dto.ReservaRequest;
import resermix.crud.estagio.entity.Reserva;
import resermix.crud.estagio.entity.Sala;
import resermix.crud.estagio.repository.ReservaRepository;
import resermix.crud.estagio.repository.SalaRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
 
@RestController
@RequestMapping("/salas")
public class SalaController {
 
    @Autowired
    private SalaRepository salaRepository;

    @Autowired
    private ReservaRepository reservaRepository;

    // ─── CREATE ──────────────────────────────────────────────────────────────────
 
    @PostMapping
    public ResponseEntity<Sala> cadastrarSala(@Valid @RequestBody Sala sala) {
        // Nova sala começa disponível por padrão
        if (sala.getDisponivel() == null) {
            sala.setDisponivel(true);
        }
        // Recursos não informados ficam como "não tem" (0 / false) em vez de NULL no banco
        sala.setTvs(sala.getTvs());
        sala.setComputadores(sala.getComputadores());
        sala.setArCondicionado(sala.getArCondicionado());
        sala.setDataShow(sala.getDataShow());
        sala.setAtivo(true);
        Sala salva = salaRepository.save(sala);
        return ResponseEntity.ok(salva);
    }
 
    // ─── READ ─────────────────────────────────────────────────────────────────────
 
    @GetMapping
    public List<Sala> listarSalas() {
        // Apenas salas ativas (as excluídas continuam no banco, mas não aparecem)
        return salaRepository.buscarAtivas();
    }
 
    @GetMapping("/{id}")
    public ResponseEntity<Sala> buscarSala(@PathVariable Long id) {
        return salaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
 
    /**
     * Sem parâmetros: todas as salas liberadas (comportamento original).
     * Com data + horarioInicio + horarioFim: apenas as salas liberadas que
     * NÃO têm reserva ativa naquele período — uma sala já reservada nesse
     * horário deixa de aparecer na lista.
     */
    @GetMapping("/disponiveis")
    public ResponseEntity<?> listarSalasDisponiveis(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime horarioInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime horarioFim) {

        boolean semFiltro = data == null && horarioInicio == null && horarioFim == null;
        if (semFiltro) {
            return ResponseEntity.ok(salaRepository.buscarDisponiveis());
        }
        if (data == null || horarioInicio == null || horarioFim == null) {
            return ResponseEntity.badRequest()
                    .body("Informe data, horarioInicio e horarioFim juntos para filtrar por período.");
        }
        String erroHorario = ReservaRequest.validarHorario(horarioInicio, horarioFim);
        if (erroHorario != null) {
            return ResponseEntity.badRequest().body(erroHorario);
        }
        return ResponseEntity.ok(salaRepository.buscarDisponiveisNoPeriodo(data, horarioInicio, horarioFim));
    }
 
    // ─── UPDATE ───────────────────────────────────────────────────────────────────
 
    @PutMapping("/{id}")
    public ResponseEntity<Sala> editarSala(@PathVariable Long id, @Valid @RequestBody Sala salaAtualizada) {
        return salaRepository.findById(id).filter(Sala::getAtivo).map(sala -> {
            sala.setName(salaAtualizada.getName());
            sala.setCapacidade(salaAtualizada.getCapacidade());
            sala.setCampus(salaAtualizada.getCampus());
            sala.setDisponivel(salaAtualizada.getDisponivel());
            sala.setTvs(salaAtualizada.getTvs());
            sala.setComputadores(salaAtualizada.getComputadores());
            sala.setArCondicionado(salaAtualizada.getArCondicionado());
            sala.setDataShow(salaAtualizada.getDataShow());
            return ResponseEntity.ok(salaRepository.save(sala));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    // ─── Alterar status (bloquearSala / liberarSala) ──────────────────────────────
 
    @PatchMapping("/{id}/status")
    public ResponseEntity<Sala> alterarStatus(@PathVariable Long id,
                                               @RequestParam Boolean disponivel) {
        return salaRepository.findById(id).filter(Sala::getAtivo).map(sala -> {
            sala.alterarStatus(disponivel);
            return ResponseEntity.ok(salaRepository.save(sala));
        }).orElse(ResponseEntity.notFound().build());
    }
 
    // ─── DELETE ───────────────────────────────────────────────────────────────────
 
    /**
     * Exclusão LÓGICA: a sala não é apagada do banco, apenas marcada como
     * inativa (ativo = false). Com isso:
     *  - o histórico de reservas continua apontando para uma sala existente;
     *  - não ocorre erro de chave estrangeira com a tabela de reservas;
     *  - as reservas futuras ainda ativas desta sala são canceladas.
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deletarSala(@PathVariable Long id) {
        return salaRepository.findById(id).filter(Sala::getAtivo).map(sala -> {
            sala.setAtivo(false);
            sala.setDisponivel(false);
            salaRepository.save(sala);

            List<Reserva> futuras = reservaRepository.buscarFuturasDaSala(id, LocalDate.now());
            futuras.forEach(Reserva::cancelar);
            reservaRepository.saveAll(futuras);

            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}