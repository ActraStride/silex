/**
 * GeometryHelper.js
 * Helpers geométricos puros, genéricos e independientes del dominio.
 *
 * No contiene lógica de ensamblaje, no sabe qué es una "vitrina" ni una "puerta
 * abatible" — sólo instancia primitivos reutilizables. Toda la orquestación
 * (loops, posiciones, ángulos, agrupamiento) vive en el builder3d.js de cada
 * producto.
 *
 * CRÍTICO: _unitBoxGeo es la ÚNICA geometría de caja usada para piezas
 * estructurales en toda la app — se escala vía mesh.scale.set() para mantener
 * un solo draw call por material. No crear BoxGeometry independientes fuera
 * de aquí para piezas estructurales.
 */

import * as THREE from 'three';

// Geometría caja unitaria compartida — un solo módulo, una sola instancia.
const _unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);

/** @returns {THREE.BoxGeometry} La geometría caja unitaria compartida (1×1×1). */
export function getUnitBoxGeo() {
    return _unitBoxGeo;
}

/**
 * Crea un Mesh escalando _unitBoxGeo — el único método permitido para
 * piezas estructurales tipo caja.
 *
 * @param {number}         w, h, d   — Dimensiones finales de la caja
 * @param {THREE.Material} mat
 * @param {number}         x, y, z   — Posición
 * @param {boolean}        [shadow=true]
 * @returns {THREE.Mesh}
 */
export function addBox(w, h, d, mat, x, y, z, shadow = true) {
    const mesh = new THREE.Mesh(_unitBoxGeo, mat);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    if (shadow) { mesh.castShadow = true; mesh.receiveShadow = true; }
    return mesh;
}

/**
 * Crea una franja LED (malla emisiva). No decide posición ni cuántas crear —
 * eso es conocimiento del producto.
 * @param {number}  ancho
 * @param {number}  color    — Color emisivo (hex)
 * @param {boolean} visible
 * @returns {THREE.Mesh}
 */
export function crearLEDStrip(ancho, color, visible) {
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(color),
        emissiveIntensity: 1.8,
        roughness: 0.35,
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.35, 1.0), mat);
    mesh.visible = visible;
    return mesh;
}

/**
 * Crea un tirador cilíndrico de aluminio. La orientación/posición final
 * respecto a la puerta es responsabilidad de quien lo use.
 * @param {THREE.Material} matAluminio
 * @returns {THREE.Mesh}
 */
export function crearTirador(matAluminio) {
    const geo  = new THREE.CylinderGeometry(0.38, 0.38, 10, 12);
    const mesh = new THREE.Mesh(geo, matAluminio);
    mesh.rotation.z = Math.PI / 2;
    return mesh;
}
