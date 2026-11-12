package resermix.crud.estagio;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Converte erros de validação (Bean Validation) em uma mensagem de texto simples,
 * para que o frontend consiga exibir o motivo exato da rejeição (ex: capacidade negativa).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> tratarErrosDeValidacao(MethodArgumentNotValidException ex) {
        String mensagens = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .distinct()
                .collect(Collectors.joining(" "));

        if (mensagens.isBlank()) {
            mensagens = "Dados inválidos.";
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(mensagens);
    }
}
