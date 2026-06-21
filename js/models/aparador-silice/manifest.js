/**
 * manifest.js
 * Metadatos del producto "aparador-silice" (antiguo Modelo C — Vitrina Minimalista).
 *
 * Fuente única de verdad para: catálogos de acabado/vidrio disponibles,
 * estado por defecto y la receta de ensamblaje fija de este producto.
 *
 * Este modelo nació de aislar el antiguo Modelo C. Las variantes de receta
 * (base con_cajon, cuerpo vidrio_completo, corona corona_madera/ninguna) ya
 * no existen — aparador-silice es un producto fijo, no configurable por receta.
 */
import * as THREE from 'three';

export const PRODUCT_ID = 'aparador-silice';

// ─── Acabados de madera disponibles ──────────────────────────────────────────
export const ACABADOS_MADERA = {
    nogal:  { color: 0x6b4226, roughness: 0.55 },
    blanco: { color: 0xf3f1ec, roughness: 0.30 },
    negro:  { color: 0x161616, roughness: 0.28 },
    encino: { color: 0xc8a978, roughness: 0.55 },
};

// ─── Tipos de vidrio disponibles ─────────────────────────────────────────────
export const CONFIG_VIDRIO = {
    claro: {
        color: 0xffffff, transmission: 0.95, roughness: 0.04,
        ior: 1.45, thickness: 0.5,
        attenuationColor: new THREE.Color(0xe8f4ff), attenuationDistance: 50,
        clearcoat: 0.3,
    },
    esmerilado: {
        color: 0xf0f0ee, transmission: 0.55, roughness: 0.55,
        ior: 1.45, thickness: 1.0,
        attenuationColor: new THREE.Color(0xf8f8f0), attenuationDistance: 80,
        clearcoat: 0.0,
    },
    tintado: {
        color: 0x5a8a60, transmission: 0.70, roughness: 0.08,
        ior: 1.45, thickness: 0.5,
        attenuationColor: new THREE.Color(0x608860), attenuationDistance: 30,
        clearcoat: 0.2,
    },
};

// ─── Estado por defecto ───────────────────────────────────────────────────────
export const DEFAULT_STATE = {
    ancho:       100,
    alto:        120,
    profundidad:  50,
    acabado:     'nogal',
    tipoVidrio:  'claro',
    entrepanos:   1,
    ledActivo:   false,
    ledTemp:     'calido',
    numPuertas:   2,
    tipoPuertas: 'abatible',
    apertura:     0,
};

// ─── Receta de ensamblaje fija ───────────────────────────────────────────────
// aparador-silice rescata únicamente las estrategias del antiguo Modelo C:
// base estándar (con zócalo, sin cajón), cuerpo de costados de madera,
// corona de tapa plana sin vuelo. No hay variantes — builder3d.js las
// implementa directamente, esta constante documenta la intención.
export const RECETA = {
    base:   'estandar',
    cuerpo: 'costados_madera',
    corona: 'tapa_plana_madera',
};
