/**
 * index.js
 * Fachada de aparador-silice — agrupa manifest, rules, pricing y builder3d
 * bajo una única interfaz de producto, consumida por models/Registry.js y app.js.
 */

import { PRODUCT_ID, DEFAULT_STATE, ACABADOS_MADERA, CONFIG_VIDRIO } from './manifest.js';
import { aplicarReglasDeManufactura } from './rules.js';
import { calcularPrecio, COSTOS } from './pricing.js';
import { build } from './builder3d.js';

export const aparadorSilice = {
    id: PRODUCT_ID,
    defaultState: DEFAULT_STATE,
    catalogos: { acabados: ACABADOS_MADERA, vidrios: CONFIG_VIDRIO },
    costos: COSTOS,

    /**
     * Sanitiza un estado crudo aplicando las reglas de manufactura del producto.
     * @param {object} state
     * @returns {object}
     */
    aplicarReglas: aplicarReglasDeManufactura,

    /**
     * Calcula el precio de un estado (idealmente ya sanitizado).
     * @param {object} state
     * @returns {number}
     */
    calcularPrecio,

    /**
     * Construye el grupo 3D y el hook de animación para un estado dado.
     * @param {object}        state
     * @param {MaterialCache} materialCache
     * @returns {{ group: THREE.Group, tick: (timestamp:number) => void }}
     */
    build,
};
