/**
 * builder3d.js
 * Ensamblaje matemático 3D de aparador-silice (antiguo Modelo C).
 *
 * Rescata ÚNICAMENTE las estrategias del código original que sobreviven:
 *   Base:   estandar           (zócalo decorativo, sin cajón)
 *   Cuerpo: costados_madera    (paneles laterales opacos)
 *   Corona: tapa_plana_madera  (sin vuelo)
 *
 * Eliminado: con_cajon, vidrio_completo, ninguna (corona), corona_madera —
 * código muerto de los antiguos Modelo A/B.
 *
 * Toda la matemática espacial (apilado vertical con yActual, división de
 * puertas, ángulos de apertura, agrupamiento) vive aquí. GeometryHelper sólo
 * provee primitivos (addBox, crearLEDStrip, crearTirador).
 *
 * Construye un nuevo THREE.Group en cada llamada (rebuild completo, igual
 * que el motor original) y retorna también una función tick(timestamp) con
 * la animación de LEDs y puertas, para que el llamador la enchufe al loop
 * del Engine sin que el Engine conozca el dominio.
 */

import * as THREE from 'three';
import { addBox, crearLEDStrip, crearTirador } from '../../core/GeometryHelper.js';
import { ACABADOS_MADERA, CONFIG_VIDRIO } from './manifest.js';

const MAT_ALUMINIO = new THREE.MeshStandardMaterial({
    color: 0xd2c8b8, metalness: 0.92, roughness: 0.22, envMapIntensity: 1.2,
});

/**
 * Construye el grupo 3D completo de aparador-silice para un estado dado.
 *
 * @param {object}       state          — Estado ya sanitizado por rules.js
 * @param {MaterialCache} materialCache
 * @returns {{ group: THREE.Group, tick: (timestamp:number) => void }}
 */
export function build(state, materialCache) {
    const group = new THREE.Group();

    // Referencias de animación, locales a este build (no globales, no en el Engine)
    const ledMeshes      = [];
    const ledPointLights = [];
    const puertas        = [];
    const targetAngles   = {};
    const targetOffsets  = {};

    // ── Materiales (cacheados; nunca dispose() entre rebuilds) ───────────────
    const defMadera  = ACABADOS_MADERA[state.acabado]    || ACABADOS_MADERA.nogal;
    const defVidrio  = CONFIG_VIDRIO[state.tipoVidrio]   || CONFIG_VIDRIO.claro;
    const matMadera    = materialCache.getMaterialMadera(state.acabado, defMadera);
    const matCristal   = materialCache.getMaterialCristal(state.tipoVidrio, defVidrio);
    const matEntrepaño = materialCache.getMaterialEntrepaño();

    // ── Alturas de bloque (receta fija: base 30, corona tapa plana 5) ────────
    const altoBase   = 30;
    const altoCorona = 5;
    const altoCuerpo = Math.max(state.alto - altoBase - altoCorona, 20);

    // Acumulador de posición vertical
    let yActual = 0;

    yActual += _drawBase(group, yActual, altoBase, state, matMadera);

    yActual += _drawCuerpo(
        group, yActual, altoCuerpo, state,
        matMadera, matCristal, matEntrepaño,
        ledMeshes, ledPointLights, puertas, targetAngles, targetOffsets,
    );

    _drawCorona(group, yActual, altoCorona, state, matMadera);

    const tick = (timestamp) => {
        // Flicker LED
        if (state.ledActivo) {
            const flicker = 1.7 + Math.sin(timestamp * 0.004) * 0.08 + Math.sin(timestamp * 0.013) * 0.04;
            ledMeshes.forEach(m => {
                if (m.material?.emissiveIntensity !== undefined)
                    m.material.emissiveIntensity = flicker;
            });
            const intensidad = state.ledTemp === 'frio' ? 0.65 : 0.75;
            ledPointLights.forEach(pl => {
                pl.intensity = intensidad + Math.sin(timestamp * 0.004) * 0.05;
            });
        }

        // Las puertas del aparador-silice ya quedan posicionadas en su ángulo/
        // offset objetivo durante el build (sin animación de interpolación en
        // el original tampoco — targetAngles/targetOffsets se aplican directo).
    };

    return { group, tick };
}

// ─── Base estándar ────────────────────────────────────────────────────────────

/**
 * Base estándar con zócalo decorativo inferior (única variante de base que
 * sobrevive en aparador-silice — sin cajón).
 */
function _drawBase(group, yBase, altoBase, s, matMadera) {
    group.add(addBox(s.ancho, altoBase, s.profundidad, matMadera,
        0, yBase + altoBase / 2, 0));

    // Zócalo decorativo (rebaje inferior)
    group.add(addBox(s.ancho - 4, 4, s.profundidad - 4,
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5, metalness: 0.3 }),
        0, yBase + 2, 0, false));

    return altoBase;
}

// ─── Cuerpo costados de madera ────────────────────────────────────────────────

/**
 * Cuerpo con paneles laterales de madera (única variante de cuerpo que
 * sobrevive en aparador-silice — sin vidrio_completo).
 */
function _drawCuerpo(
    group, yCuerpo, altoCuerpo, s,
    matMadera, matCristal, matEntrepaño,
    ledMeshes, ledPointLights, puertas, targetAngles, targetOffsets,
) {
    const em      = 1.8; // grosor de montante lateral
    const yCentro = yCuerpo + altoCuerpo / 2;

    // Paneles laterales (madera — variante costados_madera)
    group.add(addBox(em, altoCuerpo, s.profundidad, matMadera,
        -s.ancho / 2 + em / 2, yCentro, 0));
    group.add(addBox(em, altoCuerpo, s.profundidad, matMadera,
         s.ancho / 2 - em / 2, yCentro, 0));

    // Panel trasero (soporte estructural)
    group.add(addBox(s.ancho, altoCuerpo, 1.5, matMadera,
        0, yCentro, -s.profundidad / 2 + 0.75));

    // Techo interior
    group.add(addBox(s.ancho, 1.5, s.profundidad, matMadera,
        0, yCuerpo + altoCuerpo - 0.75, 0));

    // Suelo interior
    group.add(addBox(s.ancho, 1.5, s.profundidad, matMadera,
        0, yCuerpo + 0.75, 0));

    // Perfiles de aluminio en las cuatro esquinas del cuerpo
    const gp = 2.0;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
        group.add(addBox(gp, altoCuerpo, gp, MAT_ALUMINIO,
            sx * (s.ancho / 2 - gp / 2 - 0.3),
            yCentro,
            sz * (s.profundidad / 2 - gp / 2 - 0.3)));
    });

    // Entrepaños y LEDs
    const nE         = Math.min(s.entrepanos, 5);
    const espE        = altoCuerpo / (nE + 1);
    const ledColor    = s.ledTemp === 'frio' ? 0xd0eeff : 0xfff4cc;
    const ledPLColor  = s.ledTemp === 'frio' ? 0xb0d8ff : 0xfff2cc;

    for (let i = 1; i <= nE; i++) {
        const yE = yCuerpo + espE * i;
        group.add(addBox(s.ancho - em * 2 - 1, 0.8, s.profundidad - 2,
            matEntrepaño, 0, yE, 0, false));

        const ledM = crearLEDStrip(s.ancho - 8, ledColor, s.ledActivo);
        ledM.position.set(0, yE - 0.7, s.profundidad / 2 - 3);
        group.add(ledM);
        ledMeshes.push(ledM);

        if (s.ledActivo) {
            const pl = new THREE.PointLight(ledPLColor, 0.7, s.profundidad * 2, 2);
            pl.position.set(0, yE - 1.5, 0);
            group.add(pl);
            ledPointLights.push(pl);
        }
    }

    // LED superior (bajo el techo interior)
    const ledTop = crearLEDStrip(s.ancho - 8, ledColor, s.ledActivo);
    ledTop.position.set(0, yCuerpo + altoCuerpo - 0.8, s.profundidad / 2 - 3);
    group.add(ledTop);
    ledMeshes.push(ledTop);
    if (s.ledActivo) {
        const plTop = new THREE.PointLight(ledPLColor, 1.0, s.profundidad * 3, 2);
        plTop.position.set(0, yCuerpo + altoCuerpo - 2, 0);
        group.add(plTop);
        ledPointLights.push(plTop);
    }

    // Puertas
    const altoPuerta = altoCuerpo - 2;
    const yPuerta    = yCuerpo + altoCuerpo / 2;
    const zFront     = s.profundidad / 2;

    if (s.tipoPuertas === 'abatible') {
        _construirPuertasAbatibles(
            group, s.numPuertas, s.ancho, altoPuerta, yPuerta, zFront, 0.55,
            matCristal, s.apertura, puertas, targetAngles);
    } else {
        _construirPuertasCorredizas(
            group, s.numPuertas, s.ancho, altoPuerta, yPuerta, zFront, 0.55,
            matCristal, s.apertura, puertas, targetOffsets);
    }

    return altoCuerpo;
}

// ─── Corona tapa plana ────────────────────────────────────────────────────────

/**
 * Tapa plana sin vuelo — misma huella que el cuerpo, perfil mínimo
 * (única variante de corona que sobrevive en aparador-silice).
 */
function _drawCorona(group, yCorona, altoCorona, s, matMadera) {
    group.add(addBox(s.ancho, altoCorona, s.profundidad, matMadera,
        0, yCorona + altoCorona / 2, 0));
    return altoCorona;
}

// ─── Puertas abatibles ────────────────────────────────────────────────────────

function _construirPuertasAbatibles(
    group, numPuertas, ancho, altoPuerta, yPuerta, zFront, grosorV,
    matCristal, apertura, puertas, targetAngles,
) {
    const anchoPuerta = ancho / numPuertas - 0.5;
    const anguloRad   = THREE.MathUtils.degToRad(apertura);

    for (let i = 0; i < numPuertas; i++) {
        const esIzq = i < numPuertas / 2;
        const dir   = esIzq ? 1 : -1;

        const xCentroBase = -ancho / 2 + anchoPuerta / 2 + i * (anchoPuerta + 0.5);
        const xBisagra    = xCentroBase - dir * anchoPuerta / 2;

        const pGroup = new THREE.Group();
        pGroup.position.set(xBisagra, yPuerta, zFront);

        // Panel de vidrio
        const pMesh = new THREE.Mesh(
            new THREE.BoxGeometry(anchoPuerta, altoPuerta, grosorV), matCristal);
        pMesh.position.set(dir * anchoPuerta / 2, 0, 0);
        pGroup.add(pMesh);

        // Tirador — el original posicionaba con _crearTirador(anchoPuerta, lado) y
        // luego SOBREESCRIBÍA tir.position.x = dir * anchoPuerta / 2, dejando sólo
        // el z=0.6 del helper. Replicamos el resultado neto: el offset -2.5 del
        // helper original nunca llegaba a aplicarse en puertas abatibles.
        const tir = crearTirador(MAT_ALUMINIO);
        tir.position.set(dir * anchoPuerta / 2, 0, 0.6);
        pGroup.add(tir);

        // Marcos horizontales (arriba y abajo)
        [0.5, -0.5].forEach(sign => {
            const mh = new THREE.Mesh(
                new THREE.BoxGeometry(anchoPuerta + 0.5, 1.0, grosorV + 0.3), MAT_ALUMINIO);
            mh.position.set(dir * anchoPuerta / 2, sign * altoPuerta / 2, 0);
            pGroup.add(mh);
        });

        // Marco lateral exterior
        const ml = new THREE.Mesh(
            new THREE.BoxGeometry(1.0, altoPuerta, grosorV + 0.3), MAT_ALUMINIO);
        ml.position.set(dir * anchoPuerta, 0, 0);
        pGroup.add(ml);

        group.add(pGroup);

        const key = `p${i}`;
        pGroup.rotation.y = -dir * anguloRad;
        targetAngles[key] = -dir * anguloRad;
        puertas.push({ group: pGroup, key, dir, tipo: 'abatible' });
    }
}

// ─── Puertas corredizas ───────────────────────────────────────────────────────

function _construirPuertasCorredizas(
    group, numPuertas, ancho, altoPuerta, yPuerta, zFront, grosorV,
    matCristal, apertura, puertas, targetOffsets,
) {
    const anchoPuerta = ancho / numPuertas - 0.3;
    const offset = (apertura / 120) * anchoPuerta * 0.9;

    for (let i = 0; i < numPuertas; i++) {
        const esIzq   = i < numPuertas / 2;
        const dir     = esIzq ? -1 : 1;
        const zOffset = (i % 2 === 0) ? 0 : grosorV + 0.3;
        const xBase   = -ancho / 2 + anchoPuerta / 2 + i * (anchoPuerta + 0.3);

        const pGroup = new THREE.Group();
        pGroup.position.set(xBase + dir * offset, yPuerta, zFront + zOffset);

        const pMesh = new THREE.Mesh(
            new THREE.BoxGeometry(anchoPuerta, altoPuerta, grosorV), matCristal);
        pGroup.add(pMesh);

        // Tirador
        const tir = crearTirador(MAT_ALUMINIO);
        tir.position.set((esIzq ? 1 : -1) * (anchoPuerta / 2 - 3), 0, 0.6);
        pGroup.add(tir);

        // Riel superior
        const riel = new THREE.Mesh(
            new THREE.BoxGeometry(anchoPuerta, 0.8, 0.8), MAT_ALUMINIO);
        riel.position.set(0, altoPuerta / 2 + 0.4, 0);
        pGroup.add(riel);

        group.add(pGroup);

        const key = `p${i}`;
        targetOffsets[key] = xBase + dir * offset;
        puertas.push({ group: pGroup, key, xBase, dir, tipo: 'corrediza' });
    }
}
