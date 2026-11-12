/**
 * Interruptor liga/desliga acessível.
 * - A legenda "ON" / "OFF" aparece escrita dentro do botão, então o estado
 *   nunca depende só de cor (importante para daltônicos).
 * - role="switch" + aria-checked: leitores de tela anunciam "ligado/desligado".
 * - Funciona com teclado (Tab para focar, Espaço para alternar).
 */
export default function Interruptor({ id, checked, onChange, rotulo }) {
  return (
    <div className="toggle-wrap">
      <label className="switch" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch-input"
          checked={!!checked}
          aria-checked={!!checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch-track" aria-hidden="true">
          <span className="switch-legenda">{checked ? 'ON' : 'OFF'}</span>
          <span className="switch-thumb" />
        </span>
      </label>
      {rotulo && (
        <label htmlFor={id} className="switch-rotulo">
          {rotulo}
        </label>
      )}
    </div>
  );
}
