import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

// --- CONFIGURACIÓN BÁSICA DE LA ESCENA ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2230); // Fondo azul marino oscuro

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(150, 150, 250);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true; // Activar cálculo de sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Rotación más suave
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.01; // No permitir que la cámara baje del suelo

// --- ILUMINACIÓN REALISTA ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(100, 200, 100);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

// --- AGREGAR UN SUELO PARA PROYECTAR SOMBRAS ---
const floorGeo = new THREE.PlaneGeometry(500, 500);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// --- CONSTRUCCIÓN DE NUESTRA VITRINA PROTOTIPO (Paramétrica) ---
// Crearemos un grupo para mantener todas las partes alineadas
const vitrinaGroup = new THREE.Group();
scene.add(vitrinaGroup);

// Materiales de prueba
const materialMadera = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 }); // Simula formica nogal
const materialCristal = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, roughness: 0.1 });

// Guardaremos referencias a las mallas para escalarlas dinámicamente
let baseMesh, coronaMesh, cristalMesh;
// --- NUEVOS MATERIALES ---
// Aluminio anodizado para los perfiles
const materialAluminio = new THREE.MeshStandardMaterial({ 
    color: 0xd0d0d0, 
    metalness: 0.9, 
    roughness: 0.2 
});

// Cristal para los entrepaños (un poco más visible que el exterior)
const materialEntrepaño = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.3, 
    roughness: 0.1 
});

function construirVitrina(ancho, alto) {
    // Limpiar grupo anterior
    while(vitrinaGroup.children.length > 0){ 
        const obj = vitrinaGroup.children[0];
        vitrinaGroup.remove(obj); 
    }

    const profundidad = 50; 
    const altoBase = 30;
    const altoCorona = 10;
    const altoCristal = alto - altoBase - altoCorona;

    // 1. BASE (Madera)
    const baseGeo = new THREE.BoxGeometry(ancho, altoBase, profundidad);
    baseMesh = new THREE.Mesh(baseGeo, materialMadera);
    baseMesh.position.y = altoBase / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    vitrinaGroup.add(baseMesh);

    // 2. CRISTAL EXTERIOR (Cuerpo transparente)
    const cristalGeo = new THREE.BoxGeometry(ancho - 1, altoCristal, profundidad - 1);
    cristalMesh = new THREE.Mesh(cristalGeo, materialCristal);
    cristalMesh.position.y = altoBase + (altoCristal / 2);
    vitrinaGroup.add(cristalMesh);

    // 3. CORONA (Madera)
    const coronaGeo = new THREE.BoxGeometry(ancho, altoCorona, profundidad);
    coronaMesh = new THREE.Mesh(coronaGeo, materialMadera);
    coronaMesh.position.y = alto - (altoCorona / 2);
    coronaMesh.castShadow = true;
    vitrinaGroup.add(coronaMesh);

    // 4. PERFILES DE ALUMINIO (4 esquinas de la zona de cristal)
    const grosorPerfil = 2; // Perfil de 2cm x 2cm
    const perfilGeo = new THREE.BoxGeometry(grosorPerfil, altoCristal, grosorPerfil);

    // Calcular las posiciones X y Z para las 4 esquinas internas
    const posX = (ancho / 2) - (grosorPerfil / 2) - 0.5;
    const posZ = (profundidad / 2) - (grosorPerfil / 2) - 0.5;
    const posYPerfil = altoBase + (altoCristal / 2);

    const esquinas = [
        { x:  posX, z:  posZ }, // Frontal Derecha
        { x: -posX, z:  posZ }, // Frontal Izquierda
        { x:  posX, z: -posZ }, // Trasera Derecha
        { x: -posX, z: -posZ }  // Trasera Izquierda
    ];

    esquinas.forEach(esq => {
        const perfil = new THREE.Mesh(perfilGeo, materialAluminio);
        perfil.position.set(esq.x, posYPerfil, esq.z);
        perfil.castShadow = true;
        perfil.receiveShadow = true;
        vitrinaGroup.add(perfil);
    });

    // 5. ENTREPAÑOS INTERNOS (Cristal)
    // Agregamos automáticamente 1 o 2 entrepaños según la altura total
    const numEntrepaños = alto > 150 ? 2 : 1; 
    const espacioEntrepaños = altoCristal / (numEntrepaños + 1);

    for (let i = 1; i <= numEntrepaños; i++) {
        // Un poco más chico que el espacio interior para que no atraviese el aluminio
        const entrepañoGeo = new THREE.BoxGeometry(ancho - 5, 0.8, profundidad - 5); 
        const entrepaño = new THREE.Mesh(entrepañoGeo, materialEntrepaño);
        
        // Posicionamiento en altura
        entrepaño.position.y = altoBase + (espacioEntrepaños * i);
        entrepaño.castShadow = true;
        vitrinaGroup.add(entrepaño);
    }
}
// Inicializar por primera vez con valores de los sliders
let anchoActual = parseInt(document.getElementById('ancho-slider').value);
let altoActual = parseInt(document.getElementById('alto-slider').value);
construirVitrina(anchoActual, altoActual);

// --- MANEJO DE EVENTOS (SLIDERS) ---
const anchoSlider = document.getElementById('ancho-slider');
const altoSlider = document.getElementById('alto-slider');
const anchoVal = document.getElementById('ancho-val');
const altoVal = document.getElementById('alto-val');
const precioVal = document.getElementById('precio-val');

function actualizarParametros() {
    anchoActual = parseInt(anchoSlider.value);
    altoActual = parseInt(altoSlider.value);
    
    anchoVal.textContent = anchoActual;
    altoVal.textContent = altoActual;

    // Re-dibujar la vitrina con las nuevas medidas
    construirVitrina(anchoActual, altoActual);

    // Calcular cotización rápida estimada
    const precioEstimado = 2000 + (anchoActual * 15) + (altoActual * 20);
    precioVal.textContent = `$${precioEstimado.toLocaleString()}`;
}

anchoSlider.addEventListener('input', actualizarParametros);
altoSlider.addEventListener('input', actualizarParametros);

// --- REDIMENSIONADO DE VENTANA ---
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

// --- BUCLE DE ANIMACIÓN (Render continuo) ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();