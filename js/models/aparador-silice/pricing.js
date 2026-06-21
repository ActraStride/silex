/**
 * pricing.js
 * Fuente única de verdad para costos y cálculo de precio de aparador-silice.
 *
 * Función pura, sin efectos secundarios, sin acceso a DOM ni a Three.js.
 *
 * El antiguo calcularPrecio() aplicaba modificadores según la receta del
 * modelo activo (MODELO_BASE_CON_CAJON, MODELO_CUERPO_VIDRIO_COMPLETO,
 * MODELO_CORONA_NINGUNA, MODELO_CORONA_CORONA_MADERA). aparador-silice usa
 * siempre base 'estandar' + cuerpo 'costados_madera' + corona
 * 'tapa_plana_madera' — ninguna de esas variantes tenía modificador propio,
 * así que la indirección de receta y sus modificadores se eliminan por
 * completo: este producto no los necesita.
 */

/**
 * Todos los valores monetarios del configurador viven aquí.
 * Ajustar precios en este objeto; ningún otro archivo debe tener números de costo.
 */
export const COSTOS = {
    // Precio base fijo
    BASE_FIJA: 1800,

    // Dimensiones (costo por cm)
    DIM_ANCHO:        14,
    DIM_ALTO:         18,
    DIM_PROFUNDIDAD:   6,
    DIM_ENTREPANO:   350,

    // Opciones del usuario
    OPT_LED_ACTIVO:        650,
    OPT_VIDRIO_ESMERILADO: 400,
    OPT_VIDRIO_TINTADO:    300,
    OPT_4_PUERTAS:         900,
    OPT_PUERTAS_ABATIBLE:  200,
};

/**
 * Calcula el precio total de aparador-silice a partir del estado sanitizado.
 *
 * @param  {object} state — Estado (idealmente ya pasado por aplicarReglasDeManufactura).
 * @returns {number}       Precio redondeado al múltiplo de $10 más cercano.
 */
export function calcularPrecio(state) {
    const C = COSTOS;
    let precio = C.BASE_FIJA;

    // ── Dimensiones ──────────────────────────────────────────────────────────
    precio += state.ancho       * C.DIM_ANCHO;
    precio += state.alto        * C.DIM_ALTO;
    precio += state.profundidad * C.DIM_PROFUNDIDAD;
    precio += state.entrepanos  * C.DIM_ENTREPANO;

    // ── Opciones del usuario ─────────────────────────────────────────────────
    if (state.ledActivo)                    precio += C.OPT_LED_ACTIVO;
    if (state.tipoVidrio === 'esmerilado')  precio += C.OPT_VIDRIO_ESMERILADO;
    if (state.tipoVidrio === 'tintado')     precio += C.OPT_VIDRIO_TINTADO;
    if (state.numPuertas === 4)             precio += C.OPT_4_PUERTAS;
    if (state.tipoPuertas === 'abatible')   precio += C.OPT_PUERTAS_ABATIBLE;

    return Math.round(precio / 10) * 10;
}
