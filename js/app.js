/**
 * app.js
 * Entry point de Silex — instancia el Engine, el modelo de producto activo
 * y el Configurator de UI, y los conecta.
 *
 * Flujo de actualización:
 *   UI cambia → Configurator.onChange(partial)
 *     → aparadorSilice.aplicarReglas(estado fusionado)
 *     → aparadorSilice.build(estado, materialCache)  → { group, tick }
 *     → engine.setSceneGroup(group) + engine.setTickHook(tick)
 *     → aparadorSilice.calcularPrecio(estado) → Configurator.setPrecio(precio)
 *
 * El Engine nunca conoce el dominio: sólo monta el group y ejecuta el tick
 * que el builder del modelo le entrega.
 */

import { SilexEngine }   from './core/SilexEngine.js';
import { MaterialCache } from './core/MaterialCache.js';
import { models }        from './models/Registry.js';
import { Configurator }  from './ui/Configurator.js';

const modeloActivo = models.aparadorSilice;

// ── Infraestructura ───────────────────────────────────────────────────────────

const engine        = new SilexEngine({ containerId: 'canvas-container', showStats: true });
const materialCache = new MaterialCache();

// ── Estado del producto activo ────────────────────────────────────────────────

let state = modeloActivo.aplicarReglas({ ...modeloActivo.defaultState });

// ── Reconstrucción y render ───────────────────────────────────────────────────

function rebuild() {
    const { group, tick } = modeloActivo.build(state, materialCache);

    engine.setSceneGroup(group);
    engine.setTickHook(tick);
    engine.setContactShadowScale(state.ancho * 1.4, state.profundidad * 1.7);

    configurator.setPrecio(modeloActivo.calcularPrecio(state));
}

// ── UI ─────────────────────────────────────────────────────────────────────────

const configurator = new Configurator({
    onChange: (partialState) => {
        state = modeloActivo.aplicarReglas({ ...state, ...partialState });

        // Ajuste de bloom según temperatura de LED — decisión de dominio/UI,
        // el Engine sólo expone el dial.
        if ('ledTemp' in partialState) {
            engine.setBloomStrength(partialState.ledTemp === 'frio' ? 0.45 : 0.30);
        }

        rebuild();
    },
});

// ── Primer build ──────────────────────────────────────────────────────────────

rebuild();
