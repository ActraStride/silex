/**
 * Configurator.js
 * Adaptador de UI — listeners del DOM (sliders, botones) y actualización del
 * precio en pantalla.
 *
 * No contiene lógica 3D ni de negocio. No conoce SilexEngine ni aparador-silice
 * directamente: recibe un callback onChange(partialState) que el orquestador
 * (app.js) usa para aplicar reglas, reconstruir el 3D y recalcular el precio.
 */

export class Configurator {

    /**
     * @param {object}   options
     * @param {Function} options.onChange — cb(partialState) cuando el usuario cambia un control
     */
    constructor({ onChange }) {
        this._onChange = onChange;

        this._q  = (id)  => document.getElementById(id);
        this._qa = (sel) => document.querySelectorAll(sel);

        this._bindSliders();
        this._bindButtonGroups();
        this._bindLedToggle();
    }

    /**
     * Actualiza el precio mostrado en pantalla. Expuesto para que app.js lo
     * invoque tras cada recálculo (el Configurator no calcula precios).
     * @param {number} precio
     */
    setPrecio(precio) {
        const el = this._q('precio-val');
        if (el) el.textContent = `$${precio.toLocaleString('es-MX')}`;
    }

    // ─── Sliders ──────────────────────────────────────────────────────────────

    _bindSliders() {
        this._bindSlider(this._q('ancho-slider'),      this._q('ancho-val'),      'ancho');
        this._bindSlider(this._q('alto-slider'),       this._q('alto-val'),       'alto');
        this._bindSlider(this._q('profundidad-slider'),this._q('profundidad-val'),'profundidad');
        this._bindSlider(this._q('entrepanos-slider'), this._q('entrepanos-val'), 'entrepanos');

        // La apertura de puertas no tiene un display aparte en los parámetros
        // tipo, pero sí un label propio; se enlaza manualmente para mayor claridad.
        const aberturaSlider = this._q('apertura-slider');
        const aberturaVal    = this._q('apertura-val');
        aberturaSlider.addEventListener('input', () => {
            const apertura = parseInt(aberturaSlider.value);
            aberturaVal.textContent = apertura;
            this._onChange({ apertura });
        });
    }

    /**
     * Registra un slider: actualiza su label y notifica el cambio.
     * @param {HTMLElement} slider
     * @param {HTMLElement} display
     * @param {string}      stateKey
     * @param {Function}   [parse]
     */
    _bindSlider(slider, display, stateKey, parse = parseInt) {
        slider.addEventListener('input', () => {
            const value = parse(slider.value);
            display.textContent = value;
            this._onChange({ [stateKey]: value });
        });
    }

    // ─── Grupos de botones ────────────────────────────────────────────────────

    _bindButtonGroups() {
        this._bindButtonGroup('[data-acabado]',  'acabado',  'acabado');
        this._bindButtonGroup('[data-vidrio]',   'vidrio',   'tipoVidrio');
        this._bindButtonGroup('[data-npuertas]', 'npuertas', 'numPuertas', parseInt);
        this._bindButtonGroup('[data-tipo]',     'tipo',     'tipoPuertas');
        this._bindButtonGroup('[data-temp]',     'temp',     'ledTemp');
    }

    /**
     * Registra un grupo de botones de selección exclusiva.
     * @param {string}   selector
     * @param {string}   dataAttr
     * @param {string}   stateKey
     * @param {Function} [parse]
     */
    _bindButtonGroup(selector, dataAttr, stateKey, parse = (v) => v) {
        const btns = this._qa(selector);
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._onChange({ [stateKey]: parse(btn.dataset[dataAttr]) });
            });
        });
    }

    // ─── LED toggle ───────────────────────────────────────────────────────────

    _bindLedToggle() {
        const ledToggle  = this._q('led-toggle');
        const ledTempRow = this._q('led-temp-row');

        ledToggle.addEventListener('change', () => {
            const ledActivo = ledToggle.checked;
            ledTempRow.classList.toggle('visible', ledActivo);
            this._onChange({ ledActivo });
        });
    }
}
