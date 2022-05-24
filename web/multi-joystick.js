// @ts-check

const template = document.createElement('template');
template.innerHTML = `
<style>
:host {
    aspect-ratio: 1 / 1;
    border-radius: 50%;
}

#toucharea {
    position: relative;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
}

#dot {
    border-radius: 50%;
    width: 20%;
    height: 20%;
    left: 50%;
    top: 50%;
    background: red;
    position: absolute;
    touch-action: none;
    user-select: none;
    transform: translate(-50%, -50%);
}
</style>

<div id='toucharea'>
 <div id='dot'></div>
</div>
`;


export class MultiJoystick extends HTMLElement {
    /** @type {HTMLDivElement} */ #toucharea
    /** @type {HTMLDivElement} */ #dot

    constructor() {
        super();
        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.pdown = this.pdown.bind(this);
        this.pmove = this.pmove.bind(this);
        this.pup = this.pup.bind(this);
    }

    #getRelativePos(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = {
            x: (e.clientX - (rect.left + rect.right) / 2) / rect.width,
            y: (e.clientY - (rect.top + rect.bottom) / 2) / rect.height,
        };
        return pos;
    }

    #emitRelativePos(pos) {
        this.dispatchEvent(new CustomEvent('move', {detail: {pos}}));
    }

    #moveDot(pos) {
        this.#dot.style.left = `calc(${50 + 100*pos.x}%)`
        this.#dot.style.top = `calc(${50 + 100*pos.y}%)`
    }

    pdown(e) {
        const pos = this.#getRelativePos(e);
        this.#moveDot(pos);
        this.#emitRelativePos(pos);
        this.pointerdown=true;
        this.#toucharea.setPointerCapture(e.pointerId);
    }

    pmove(e) {
        if (e.cancelable) e.preventDefault();
        if (this.pointerdown) {
            const pos = this.#getRelativePos(e);
            this.#moveDot(pos);
            this.#emitRelativePos(pos);
        }
    }

    pup(e) {
        this.pointerdown=false;
        this.#moveDot({x:0, y:0});
        this.#emitRelativePos(null);
        this.#toucharea.releasePointerCapture(e.pointerId);
    }

    connectedCallback() {
        this.#toucharea = this.shadowRoot.querySelector('#toucharea');
        this.#dot = this.shadowRoot.querySelector('#dot');

        this.#toucharea.addEventListener('pointerdown', this.pdown);
        this.#toucharea.addEventListener('pointermove', this.pmove);
        this.#toucharea.addEventListener('pointerup', this.pup);
    }

}
customElements.define('multi-joystick', MultiJoystick);
