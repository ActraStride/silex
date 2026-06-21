/**
 * Registry.js
 * Registro de modelos/productos disponibles en Silex.
 *
 * Exportador simple — sin lógica de selección ni indirección. app.js importa
 * directamente el producto que necesita instanciar.
 */

import { aparadorSilice } from './aparador-silice/index.js';

export const models = { aparadorSilice };
