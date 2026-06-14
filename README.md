# threeJS-silixe 🛠️📦

Un configurador interactivo de vitrinas en 3D paramétrico, desarrollado de forma nativa para **Vitrinas Sílice** (Guadalajara, México).

Este repositorio es un entorno de pruebas (*sandbox*) diseñado para prototipar una herramienta interactiva de cotización en tiempo real. El objetivo final de este módulo es reemplazar secciones estáticas y poco interactivas de la web de producción por una experiencia 3D fluida que filtre prospectos y aumente la conversión.

---

## 🚀 Características del Prototipo

* **Geometría Paramétrica Real:** No se escala un modelo estático. Un algoritmo en JavaScript recalcula y posiciona en tiempo real cada elemento (base de madera, corona superior, cristales, herrajes de aluminio y entrepaños internos) según las dimensiones de los sliders.
* **Cálculo de Cotización Dinámico:** Cuenta con una fórmula de estimación de costos en la interfaz gráfica que se actualiza al instante conforme el usuario modifica el diseño.
* **Rendimiento y Ligereza:** Al renderizar primitivas optimizadas directamente a través de WebGL en el dispositivo del usuario, se logra una animación fluida de 60 FPS sin sobrecargar la red ni el procesador.
* **Zero NPM Bloat:** Desarrollado sin frameworks complejos (React/Svelte) ni empaquetadores (Vite/Webpack). Corre directamente en el navegador utilizando **módulos nativos ES6** e **Import Maps** [1.1.4, 1.2.3].

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 / CSS3 / JavaScript (ES6)** nativo.
* **Three.js** (v0.160.0) como motor de renderizado WebGL [1.1.2, 1.2.3].
* **OrbitControls** para permitir navegación interactiva con el cursor (rotación, zoom y paneo) [1.1.2, 1.2.3].

---

## 📦 Instalación y Uso Local

Debido a que el navegador restringe la carga de módulos locales de JavaScript (`import`) por políticas de seguridad (CORS), no es posible ejecutar el proyecto abriendo el archivo `index.html` con doble clic de forma directa. Se requiere servir el directorio a través de un servidor web local sencillo.

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/threeJS-silixe.git
cd threeJS-silixe
```

### 2. Levantar un servidor local rápido
Puedes usar cualquiera de las siguientes herramientas estándar que tengas instaladas en tu sistema:

* **Con Python** (Si cuentas con Python 3):
  ```bash
  python3 -m http.server 8000
  ```
* **Con PHP**:
  ```bash
  php -S localhost:8000
  ```
* **Con Node.js**:
  ```bash
  npx serve
  ```

### 3. Ejecutar en el navegador
Abre tu navegador de preferencia y accede a:
`http://localhost:8000` (o el puerto indicado por el servicio que levantaste).

---

## 📈 Próximos Pasos (Roadmap)

* [ ] **Carga de Texturas PBR:** Integración del catálogo de acabados reales del proveedor de Formica (maderas y lisos) usando `THREE.TextureLoader`.
* [ ] **Modelos de Vitrinas:** Implementación de las funciones de ensamblaje para los modelos restantes (Aparadores y Torres) basándose en los parámetros de la base, cuerpo y corona.
* [ ] **API de WhatsApp:** Vinculación del botón de cotización para enviar los parámetros exactos del diseño (ancho, alto, tipo de vitrina, textura y costo estimado) prellenados en un mensaje directo de WhatsApp.
