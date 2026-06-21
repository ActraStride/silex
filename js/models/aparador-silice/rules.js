/**
 * rules.js
 * Reglas de manufactura de aparador-silice — funciones puras, sin Three.js,
 * sin efectos secundarios.
 *
 * El antiguo código consultaba REGLAS_MODELOS[state.modelo] porque convivían
 * varias recetas. Ahora hay un único producto con cuerpo 'costados_madera'
 * fijo, así que la regla "cuerpo vidrio_completo exige mínimo 2 puertas" es
 * código muerto (ese cuerpo no existe en este producto) y se elimina.
 */

/**
 * Evalúa las restricciones de manufactura y devuelve un estado sanitizado.
 *
 * Regla aplicada:
 *  1. Ancho > 150 cm → forzar puertas corredizas (las abatibles no caben).
 *
 * @param  {object} state — Estado crudo tal como viene de la UI o initialState.
 * @returns {object}       Nuevo objeto de estado con las reglas aplicadas.
 *                         NUNCA muta el objeto recibido.
 */
export function aplicarReglasDeManufactura(state) {
    const sanitizado = { ...state };

    if (sanitizado.ancho > 150) {
        sanitizado.tipoPuertas = 'corrediza';
    }

    return sanitizado;
}
