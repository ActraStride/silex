/**
 * MaterialCache.js
 * Generación de texturas procedurales de PRODUCTO (madera, normal, roughness)
 * y caché de materiales Three.js derivados de ellas.
 *
 * Las funciones de textura se migran tal cual del motor original — son el
 * núcleo del aspecto fotorrealista y no deben resumirse ni simplificarse.
 *
 * CRÍTICO: nunca llamar dispose() sobre los materiales cacheados desde un
 * builder3d.js — eso rompe el caché de shaders de Three.js entre rebuilds.
 */

import * as THREE from 'three';

export class MaterialCache {

    constructor() {
        this._cacheMadera         = {};
        this._cacheCristal        = {};
        this._cacheEntrepaño      = null;
        this._cacheMaderaColorTex = {};
        this._normalTex           = null;
        this._roughnessTex        = null;
    }

    // ─── Fábricas de materiales (cacheadas) ──────────────────────────────────

    /**
     * @param {string} key   — clave de ACABADOS_MADERA (ej. 'nogal')
     * @param {object} def   — { color, roughness } desde manifest.js del modelo
     * @returns {THREE.MeshStandardMaterial}
     */
    getMaterialMadera(key, def) {
        if (!this._cacheMadera[key]) this._cacheMadera[key] = this._crearMaterialMadera(key, def);
        return this._cacheMadera[key];
    }

    /**
     * @param {string} tipo  — clave de CONFIG_VIDRIO (ej. 'claro')
     * @param {object} def   — definición de vidrio desde manifest.js del modelo
     * @returns {THREE.MeshPhysicalMaterial}
     */
    getMaterialCristal(tipo, def) {
        if (!this._cacheCristal[tipo]) this._cacheCristal[tipo] = this._crearMaterialCristal(def);
        return this._cacheCristal[tipo];
    }

    /** @returns {THREE.MeshPhysicalMaterial} Material único de entrepaño de vidrio. */
    getMaterialEntrepaño() {
        if (!this._cacheEntrepaño) this._cacheEntrepaño = this._crearMaterialEntrepaño();
        return this._cacheEntrepaño;
    }

    // ─── Fábricas internas ────────────────────────────────────────────────────

    _crearMaterialMadera(key, def) {
        return new THREE.MeshStandardMaterial({
            map:          this._getMaderaColorTex(key, def.color),
            normalMap:    this._getNormalTex(),
            normalScale:  new THREE.Vector2(0.4, 0.4),
            roughnessMap: this._getRoughnessTex(),
            roughness:    def.roughness,
            metalness:    0.04,
            envMapIntensity: 0.7,
        });
    }

    _crearMaterialCristal(c) {
        return new THREE.MeshPhysicalMaterial({
            color:        c.color,
            transmission: c.transmission,
            transparent:  true,
            opacity:      1,
            roughness:    c.roughness,
            metalness:    0,
            ior:          c.ior,
            thickness:    c.thickness,
            envMapIntensity: 1.2,
            clearcoat:    c.clearcoat,
            attenuationColor:    c.attenuationColor,
            attenuationDistance: c.attenuationDistance,
            side: THREE.DoubleSide,
        });
    }

    _crearMaterialEntrepaño() {
        return new THREE.MeshPhysicalMaterial({
            color:        0xeaf6ff,
            transmission: 0.85,
            transparent:  true,
            opacity:      1,
            roughness:    0.08,
            thickness:    0.3,
            ior:          1.45,
            attenuationColor:    new THREE.Color(0xd8eeff),
            attenuationDistance: 30,
            side: THREE.DoubleSide,
        });
    }

    // ─── Texturas procedurales (canvas 2D) ────────────────────────────────────
    // CRÍTICO: estos métodos deben mantenerse intactos. No resumir, no simplificar.

    _crearTexturaMaderaColor(baseColorHex) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        const base = new THREE.Color(baseColorHex);
        ctx.fillStyle = `#${base.getHexString()}`;
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 50; i++) {
            const y = Math.random() * size;
            const h = 0.8 + Math.random() * 4;
            const shade = (Math.random() - 0.5) * 0.2;
            const c = base.clone().offsetHSL(0, 0, shade);
            ctx.fillStyle = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${0.2 + Math.random() * 0.4})`;
            ctx.fillRect(0, y, size, h);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _crearTexturaMaderaNormal() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgb(128,128,255)';
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 70; i++) {
            const y = Math.random() * size;
            const h = 0.5 + Math.random() * 2.5;
            const o = (Math.random() - 0.5) * 25;
            ctx.fillStyle = `rgb(${128 + o},${128 + o * 0.4},255)`;
            ctx.fillRect(0, y, size, h);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    _crearTexturaMaderaRoughness() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgb(145,145,145)';
        ctx.fillRect(0, 0, size, size);
        for (let i = 0; i < 60; i++) {
            const y = Math.random() * size;
            const h = 0.5 + Math.random() * 3;
            const v = 90 + Math.round(Math.random() * 90);
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(0, y, size, h);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    // Las texturas de normal/roughness son compartidas entre todos los
    // materiales de madera para evitar duplicados en VRAM.
    _getNormalTex() {
        if (!this._normalTex) this._normalTex = this._crearTexturaMaderaNormal();
        return this._normalTex;
    }

    _getRoughnessTex() {
        if (!this._roughnessTex) this._roughnessTex = this._crearTexturaMaderaRoughness();
        return this._roughnessTex;
    }

    _getMaderaColorTex(key, color) {
        if (!this._cacheMaderaColorTex[key])
            this._cacheMaderaColorTex[key] = this._crearTexturaMaderaColor(color);
        return this._cacheMaderaColorTex[key];
    }
}
