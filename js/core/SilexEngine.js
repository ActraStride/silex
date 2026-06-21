/**
 * SilexEngine.js
 * Infraestructura 3D pura — escena, cámara, luces, controles, postprocesado y loop.
 *
 * El Engine NO sabe nada de dominio (vitrinas, puertas, LEDs, precios).
 * Su única responsabilidad es renderizar lo que se le monte vía setSceneGroup()
 * y ejecutar, en cada frame, el callback opcional registrado con setTickHook().
 *
 * Uso:
 *   const engine = new SilexEngine({ containerId: 'canvas-container', showStats: true });
 *   engine.setSceneGroup(grupoDelModelo);
 *   engine.setTickHook((timestamp) => { ... animación de dominio ... });
 */

import * as THREE from 'three';
import { OrbitControls }    from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment }  from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/addons/postprocessing/OutputPass.js';
import Stats                from 'three/addons/libs/stats.module.js';

export class SilexEngine {

    /**
     * @param {object}   options
     * @param {string}   options.containerId — ID del div contenedor del canvas
     * @param {boolean} [options.showStats]  — Muestra panel FPS + telemetría WebGL
     */
    constructor(options = {}) {
        const { containerId, showStats = false } = options;

        // Grupo de escena actualmente montado (propiedad del dominio, no del engine)
        this._sceneGroup = null;

        // Hook de animación por frame, inyectado por quien orquesta el dominio
        this._tickHook = null;

        this._initContainer(containerId);
        this._initRenderer();
        this._initScene();
        this._initCamera();
        this._initControls();
        this._initEnvironment();
        this._initLights();
        this._initFloor();
        this._initPostprocessing();
        if (showStats) this._initStats();

        this._onResize = this._onResize.bind(this);
        window.addEventListener('resize', this._onResize);

        this._animate = this._animate.bind(this);
        requestAnimationFrame(this._animate);
    }

    // ─── API Pública ──────────────────────────────────────────────────────────

    /**
     * Monta un THREE.Group como el contenido activo de la escena, retirando
     * cualquier grupo previamente montado (sin hacer dispose de materiales).
     * @param {THREE.Group} group
     */
    setSceneGroup(group) {
        if (this._sceneGroup) {
            this._scene.remove(this._sceneGroup);
        }
        this._sceneGroup = group;
        if (group) this._scene.add(group);
    }

    /**
     * Registra (o reemplaza) el callback ejecutado en cada frame del loop.
     * El Engine no interpreta qué hace el callback — sólo lo invoca con el timestamp.
     * @param {(timestamp:number) => void} fn
     */
    setTickHook(fn) {
        this._tickHook = typeof fn === 'function' ? fn : null;
    }

    /**
     * Ajusta el plano de sombra de contacto bajo el modelo activo.
     * Expuesto porque depende de las dimensiones del producto, no del engine.
     * @param {number} scaleX
     * @param {number} scaleZ
     */
    setContactShadowScale(scaleX, scaleZ) {
        this._reflPlane.scale.set(scaleX, scaleZ, 1);
    }

    /** Acceso de sólo lectura al material de aluminio compartido (uso transversal de UI/builders). */
    get sharedEnvironment() {
        return { scene: this._scene };
    }

    /** Libera todos los recursos WebGL y listeners. */
    destroy() {
        window.removeEventListener('resize', this._onResize);
        this._renderer.dispose();
        this._composer.dispose?.();
    }

    // ─── Inicialización ───────────────────────────────────────────────────────

    _initContainer(id) {
        this._container = document.getElementById(id);
        if (!this._container) throw new Error(`SilexEngine: contenedor #${id} no encontrado`);
        this._container.style.position = 'relative';
    }

    _initRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
        this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        this._renderer.toneMapping       = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.3;
        this._renderer.outputColorSpace  = THREE.SRGBColorSpace;
        // Acumulación manual para telemetría multi-pass
        this._renderer.info.autoReset    = false;
        this._container.appendChild(this._renderer.domElement);
    }

    _initScene() {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x1a1208);
        this._scene.fog = new THREE.FogExp2(0x1a1208, 0.0015);
    }

    _initCamera() {
        const { clientWidth: w, clientHeight: h } = this._container;
        const aspect = w / h;

        // FOV base pensado para contenedores ~cuadrados/verticales (configurador full).
        // En contenedores anchos y bajos (widgets embebidos) el frustum vertical
        // se vuelve muy estrecho y la vitrina se corta arriba/abajo.
        // Compensamos abriendo el FOV vertical cuando aspect > 1.3.
        const baseFov = 38;
        const fov = aspect > 1.3
            ? Math.min(baseFov * (aspect / 1.3), 58)
            : baseFov;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 3000);
        this._camera.position.set(200, 150, 280);
    }

    _initControls() {
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.05;
        this._controls.minDistance   = 80;
        this._controls.maxDistance   = 700;
        this._controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this._controls.target.set(0, 70, 0);
    }

    _initEnvironment() {
        const pmrem = new THREE.PMREMGenerator(this._renderer);
        pmrem.compileEquirectangularShader();
        const envRT = pmrem.fromScene(new RoomEnvironment(), 0.06);
        this._scene.environment = envRT.texture;
        pmrem.dispose();
    }

    _initLights() {
        // Ambiente
        this._scene.add(new THREE.AmbientLight(0xfff0d0, 0.28));

        // Key light
        const key = new THREE.DirectionalLight(0xfff5e0, 1.6);
        key.position.set(150, 280, 180);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.near   = 10;
        key.shadow.camera.far    = 900;
        key.shadow.camera.left   = -250;
        key.shadow.camera.right  = 250;
        key.shadow.camera.top    = 300;
        key.shadow.camera.bottom = -200;
        key.shadow.bias   = -0.0004;
        key.shadow.radius = 6;
        this._scene.add(key);

        // Fill light
        const fill = new THREE.DirectionalLight(0xd0e8ff, 0.22);
        fill.position.set(-200, 60, -80);
        this._scene.add(fill);

        // Rim light
        const rim = new THREE.PointLight(0xffcc88, 0.9, 700);
        rim.position.set(0, 200, -240);
        this._scene.add(rim);

        // Spot focal (animado)
        this._spotFocal = new THREE.SpotLight(0xfff8e8, 2.0, 800, Math.PI / 8, 0.35, 1.5);
        this._spotFocal.position.set(0, 360, 60);
        this._spotFocal.castShadow = true;
        this._spotFocal.shadow.mapSize.set(1024, 1024);
        this._spotFocal.shadow.radius = 4;
        this._spotFocal.target.position.set(0, 60, 0);
        this._scene.add(this._spotFocal);
        this._scene.add(this._spotFocal.target);

        // Spots laterales
        const makeSpot = (x, tx) => {
            const s = new THREE.SpotLight(0xffe0c0, 0.7, 600, Math.PI / 10, 0.5, 2);
            s.position.set(x, 300, 40);
            s.target.position.set(tx, 60, 0);
            this._scene.add(s);
            this._scene.add(s.target);
        };
        makeSpot(-160, -60);
        makeSpot( 160,  60);
    }

    _initFloor() {
        // Suelo parquet — la textura procedural vive en MaterialCache; el Engine
        // recibe el mapa ya generado para no duplicar lógica de canvas 2D aquí.
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1200, 1200),
            new THREE.MeshStandardMaterial({
                map: this._crearTexturaParquetLocal(),
                roughness: 0.45, metalness: 0.08, envMapIntensity: 0.4,
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this._scene.add(floor);

        // Plano de reflexión / sombra de contacto — su escala depende de las
        // dimensiones del producto activo, ajustada vía setContactShadowScale().
        this._reflPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.MeshStandardMaterial({
                color: 0xfff4d8, roughness: 0.1, metalness: 0.3,
                transparent: true, opacity: 0.08, depthWrite: false,
            })
        );
        this._reflPlane.rotation.x = -Math.PI / 2;
        this._reflPlane.position.y = 0.06;
        this._scene.add(this._reflPlane);

        // Pared trasera
        const wall = new THREE.Mesh(
            new THREE.PlaneGeometry(900, 500),
            new THREE.MeshStandardMaterial({
                color: 0x2a1e12, roughness: 0.85, metalness: 0, envMapIntensity: 0.1,
            })
        );
        wall.position.set(0, 250, -300);
        wall.receiveShadow = true;
        this._scene.add(wall);
    }

    // La textura de parquet es ambiental (escenografía), no de producto —
    // se mantiene aquí tal cual para no acoplar MaterialCache (que cachea
    // materiales de PRODUCTO) con el decorado fijo de la escena.
    _crearTexturaParquetLocal() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1e1208';
        ctx.fillRect(0, 0, size, size);

        const numTabletes = 12;
        const tabH = size / numTabletes;
        for (let i = 0; i < numTabletes; i++) {
            const y = i * tabH;
            const shade = (Math.random() - 0.5) * 15;
            const r = 30 + shade, g = 18 + shade * 0.5, b = 8 + shade * 0.3;
            ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
            ctx.fillRect(0, y + 1, size, tabH - 2);
            for (let j = 0; j < 8; j++) {
                const vy = y + Math.random() * tabH;
                ctx.strokeStyle = `rgba(${Math.round(r+10)},${Math.round(g+5)},${Math.round(b+2)},0.25)`;
                ctx.lineWidth = 0.5 + Math.random();
                ctx.beginPath();
                ctx.moveTo(0, vy);
                ctx.lineTo(size, vy + (Math.random() - 0.5) * 3);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 6);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    _initPostprocessing() {
        const { clientWidth: w, clientHeight: h } = this._container;
        this._composer = new EffectComposer(this._renderer);
        this._composer.addPass(new RenderPass(this._scene, this._camera));

        this._bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.35, 0.35, 0.80);
        this._composer.addPass(this._bloomPass);
        this._composer.addPass(new OutputPass());
    }

    /**
     * Ajusta la intensidad del bloom. Expuesto porque hoy depende de la
     * temperatura de LED elegida, una decisión de dominio/UI, no del engine.
     * @param {number} strength
     */
    setBloomStrength(strength) {
        this._bloomPass.strength = strength;
    }

    _initStats() {
        this._stats = new Stats();
        this._stats.showPanel(0);
        Object.assign(this._stats.dom.style, {
            position: 'absolute', top: '10px', left: '10px',
        });
        this._container.appendChild(this._stats.dom);

        this._infoDiv = document.createElement('div');
        Object.assign(this._infoDiv.style, {
            position: 'absolute', bottom: '10px', left: '10px',
            backgroundColor: 'rgba(26,18,8,0.85)', color: '#fff0d0',
            fontFamily: 'monospace', fontSize: '11px',
            padding: '10px', borderRadius: '5px',
            border: '1px solid #6b4226', pointerEvents: 'none', zIndex: '100',
        });
        this._container.appendChild(this._infoDiv);
    }

    // ─── Resize ───────────────────────────────────────────────────────────────

    _onResize() {
        const w = this._container.clientWidth;
        const h = this._container.clientHeight;
        const aspect = w / h;

        const baseFov = 38;
        this._camera.fov = aspect > 1.3
            ? Math.min(baseFov * (aspect / 1.3), 58)
            : baseFov;

        this._camera.aspect = aspect;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(w, h);
        this._composer.setSize(w, h);
    }

    // ─── Loop de animación ────────────────────────────────────────────────────

    _animate(timestamp) {
        requestAnimationFrame(this._animate);

        this._controls.update();

        // Respiración del spot focal — decorado fijo de la escena, no de dominio.
        this._spotFocal.intensity = 2.0 + Math.sin(timestamp * 0.0007) * 0.05;

        // El Engine no sabe qué anima el dominio (LEDs, puertas, etc.) —
        // simplemente ejecuta el hook registrado, si existe.
        if (this._tickHook) this._tickHook(timestamp);

        this._renderer.info.reset();
        this._composer.render();

        if (this._stats) {
            this._stats.update();
            const info = this._renderer.info;
            this._infoDiv.innerHTML =
                `<strong>TELEMETRÍA WEBGL:</strong><br/>
                 • Draw Calls: ${info.render.calls}<br/>
                 • Triángulos: ${info.render.triangles.toLocaleString()}<br/>
                 • Texturas en Memoria: ${info.memory.textures}<br/>
                 • Geometrías: ${info.memory.geometries}`;
        }
    }
}
