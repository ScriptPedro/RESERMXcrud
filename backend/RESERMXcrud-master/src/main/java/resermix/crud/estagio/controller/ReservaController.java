package resermix.crud.estagio.controller;

import resermix.crud.estagio.dto.ReservaRequest;
import resermix.crud.estagio.entity.Reserva;
import resermix.crud.estagio.entity.Sala;
import resermix.crud.estagio.entity.StatusReserva;
import resermix.crud.estagio.entity.Usuario;
import resermix.crud.estagio.repository.ReservaRepository;
import resermix.crud.estagio.repository.SalaRepository;
import resermix.crud.estagio.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Implementa os casos de uso suc_realizar_reserva e suc_gerenciar_historico.
 *
 * Importante: não existe HistoricoController à parte. O "histórico de
 * reservas" é obtido consultando esta mesma entidade Reserva (ver
 * GET /reservas/historico), conforme decisão explicada na análise do
 * relatório de estágio.
 */
@RestController
@RequestMapping("/reservas")
public class ReservaController {

    @Autowired
    private ReservaRepository reservaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SalaRepository salaRepository;

    // ─── CREATE (suc_realizar_reserva) ─────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> realizarReserva(@Valid @RequestBody ReservaRequest requisicao) {
        String erroHorario = ReservaRequest.validarHorario(requisicao.getHorarioInicio(), requisicao.getHorarioFim());
        if (erroHorario != null) {
            return ResponseEntity.badRequest().body(erroHorario);
        }

        Optional<Usuario> usuario = usuarioRepository.findById(requisicao.getUsuarioId())
                .filter(Usuario::getAtivo);
        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuário não encontrado.");
        }

        Optional<Sala> sala = salaRepository.findById(requisicao.getSalaId());
        if (sala.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sala não encontrada.");
        }
        if (!sala.get().verificarDisponibilidade()) {
            return ResponseEntity.badRequest().body("Esta sala não está disponível para reservas no momento.");
        }

        List<Reserva> conflitos = reservaRepository.buscarConflitos(
                requisicao.getSalaId(), requisicao.getData(),
                requisicao.getHorarioInicio(), requisicao.getHorarioFim(), null);
        if (!conflitos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Já existe uma reserva para esta sala nesse período.");
        }

        Reserva reserva = new Reserva();
        reserva.setUsuario(usuario.get());
        reserva.setSala(sala.get());
        reserva.setData(requisicao.getData());
        reserva.setHorarioInicio(requisicao.getHorarioInicio());
        reserva.setHorarioFim(requisicao.getHorarioFim());
        reserva.setObservacao(requisicao.getObservacao());
        // Sem etapa de aprovação no fluxo atual: reserva sem conflitos já nasce confirmada.
        reserva.setStatus(StatusReserva.CONFIRMADA);

        Reserva salva = reservaRepository.save(reserva);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // ─── READ ───────────────────────────────────────────────────────────────

    @GetMapping
    public List<Reserva> listarReservas() {
        return reservaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Reserva> buscarReserva(@PathVariable Long id) {
        return reservaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<Reserva> buscarPorUsuario(@PathVariable Long usuarioId) {
        return reservaRepository.findByUsuarioIdOrderByDataDescHorarioInicioDesc(usuarioId);
    }

    @GetMapping("/sala/{salaId}")
    public List<Reserva> buscarPorSala(@PathVariable Long salaId) {
        return reservaRepository.findBySalaIdOrderByDataDescHorarioInicioDesc(salaId);
    }

    /**
     * suc_gerenciar_historico: consulta de reservas já realizadas, com
     * filtros opcionais por usuário, sala, status e período. Quando não há
     * registros, retorna 200 com lista vazia (nunca 404), pois a ausência de
     * histórico não é um erro.
     */
    @GetMapping("/historico")
    public List<Reserva> consultarHistorico(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long salaId,
            @RequestParam(required = false) StatusReserva status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        return reservaRepository.buscarHistorico(usuarioId, salaId, status, dataInicio, dataFim);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> editarReserva(@PathVariable Long id, @Valid @RequestBody ReservaRequest requisicao) {
        Optional<Reserva> reservaExistente = reservaRepository.findById(id);
        if (reservaExistente.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Reserva reserva = reservaExistente.get();

        if (reserva.getStatus() == StatusReserva.CANCELADA) {
            return ResponseEntity.badRequest().body("Não é possível alterar uma reserva cancelada.");
        }
        String erroHorario = ReservaRequest.validarHorario(requisicao.getHorarioInicio(), requisicao.getHorarioFim());
        if (erroHorario != null) {
            return ResponseEntity.badRequest().body(erroHorario);
        }

        Optional<Sala> sala = salaRepository.findById(requisicao.getSalaId());
        if (sala.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Sala não encontrada.");
        }
        if (!sala.get().getAtivo()) {
            return ResponseEntity.badRequest().body("Esta sala foi excluída e não aceita reservas.");
        }

        List<Reserva> conflitos = reservaRepository.buscarConflitos(
                requisicao.getSalaId(), requisicao.getData(),
                requisicao.getHorarioInicio(), requisicao.getHorarioFim(), id);
        if (!conflitos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Já existe uma reserva para esta sala nesse período.");
        }

        reserva.setSala(sala.get());
        reserva.setData(requisicao.getData());
        reserva.setHorarioInicio(requisicao.getHorarioInicio());
        reserva.setHorarioFim(requisicao.getHorarioFim());
        reserva.setObservacao(requisicao.getObservacao());

        return ResponseEntity.ok(reservaRepository.save(reserva));
    }

    // ─── Cancelar reserva (não exclui o histórico) ────────────────────────

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarReserva(@PathVariable Long id) {
        return reservaRepository.findById(id).map(reserva -> {
            if (reserva.getStatus() == StatusReserva.CANCELADA) {
                return ResponseEntity.badRequest().body("Esta reserva já está cancelada.");
            }
            reserva.cancelar();
            return ResponseEntity.ok(reservaRepository.save(reserva));
        }).orElse(ResponseEntity.notFound().build());
    }
}
