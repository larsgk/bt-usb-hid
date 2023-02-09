// @ts-check
import { MultiJoystick } from './multi-joystick.js';
import { SimpleDriver } from './simple-driver.js';

const _use_velocity = true;

const template = document.createElement('template');
template.innerHTML = `
<style>
    :host {
        font-family: UbuntuCondensed, Arial;
    }

    .flex-container {
        display: flex;
        height: 100%;
    }
    .content {
        margin: auto;
        position: relative;
    }

    .controls {
        display: flex;
        width: 90vmin;
        gap: 4px;
    }

    multi-joystick {
        box-sizing: border-box;
        flex: 1;
        border: 2px solid black;
    }

    .mousebtns {
        display: flex;
        justify-content: space-between;
        flex: 0.33;
        gap: 4px;
    }

    @media (orientation: landscape) {
        .controls {
            flex-direction: row;
        }
        .mousebtns {
            flex-direction: column-reverse;
        }
      }

    @media (orientation: portrait) {
        .controls {
            flex-direction: column;
            max-width: 60vmax;
            width: 90vmin;
        }
        .mousebtns {
            flex-direction: row;
        }
    }

    #connectbtn {
        position: fixed;
        left: 0;
        top: 0;
        aspect-ratio: 1 / 1;
        border-radius: 20%;
        border: 8px solid red;
        width: 80px;
        font-size: 4em;
    }

    .connecting {
        animation: connecting 2s infinite;
    }

    @keyframes connecting {
        0% {border-color: transparent;}
        50% {border-color: blue;}
        100% {border-color: transparent;}
    }

    .connected {
        animation: connected 2s infinite;
    }

    @keyframes connected {
        0% {border-color: darkgreen;}
        50% {border-color: green;}
        100% {border-color: darkgreen;}
    }

    .mousebtn {
        display: flex;
        box-sizing: border-box;
        aspect-ratio: 1 / 1;
        border-radius: 20%;
        border: 2px solid black;
        flex-grow: inherit;
        justify-content: center;
        align-items: center;
        font-size: 2em;
        touch-action: none;
        user-select: none;
    }

    .mousebtn[pressed] {
        background-color: black;
        color: white;
    }


    .below {
        border-radius: 10px;
        background: #e0e0e0;
        box-shadow: inset 5px 5px 10px #bebebe,
                    inset -5px -5px 10px #ffffff;
    }

    button {
        min-height: 40px;
    }
</style>

<div id='connectbtn' class='disconnected'>🖱️</div>
<div class="flex-container">
    <div class="content">
        <div class='controls'>
            <multi-joystick></multi-joystick>
            <div class='mousebtns'>
                <div id='btn_left' class='mousebtn'>L</div>
                <div id='btn_middle'  class='mousebtn'>M</div>
                <div id='btn_right'  class='mousebtn'>R</div>
            </div>
        </div>
    </div>
</div>
`;

export class MainApp extends HTMLElement {
    /** @type {MultiJoystick} */ #joystick
    /** @type {HTMLDivElement} */ #connectbtn
    /** @type {HTMLDivElement} */ #btnleft
    /** @type {HTMLDivElement} */ #btnmiddle
    /** @type {HTMLDivElement} */ #btnright

    #lastpos

    constructor() {
        super();

        const shadowRoot = this.attachShadow({mode: 'open'});
        shadowRoot.appendChild(template.content.cloneNode(true));

        this.#lastpos = null;

        this.doMove = this.doMove.bind(this);
        this.toggleConnection = this.toggleConnection.bind(this);

        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
    }

    connectedCallback() {
        this.#connectbtn = this.shadowRoot.querySelector('#connectbtn');

        this.#btnleft = this.shadowRoot.querySelector('#btn_left');
        this.#btnmiddle = this.shadowRoot.querySelector('#btn_middle');
        this.#btnright = this.shadowRoot.querySelector('#btn_right');
        this.#initButtonHandlers();

        this.#joystick = this.shadowRoot.querySelector('multi-joystick');

        if (_use_velocity) {
            this.#joystick.addEventListener('move', e => {
                this.#lastpos = e.detail.pos;
                if (this.#lastpos) {
                    SimpleDriver.velocity(this.#lastpos.x*2000, this.#lastpos.y*2000);
                } else {
                    SimpleDriver.velocity(0, 0);
                }
            });
        } else {
            this.#joystick.addEventListener('move', e => this.#lastpos = e.detail.pos);
            setInterval(this.doMove, 100);
        }

        this.#connectbtn.addEventListener('click', this.toggleConnection);

        SimpleDriver.addEventListener('connect', this.handleConnect);
        SimpleDriver.addEventListener('disconnect', this.handleDisconnect);

    }

    // TODO: Cleanup
    #initButtonHandlers() {
        const btn = {
            left: false,
            right: false,
            middle: false
        };

        const btnchange = () => {
            SimpleDriver.buttons(btn.left, btn.right, btn.middle);
            btn.left ? this.#btnleft.setAttribute('pressed', '') : this.#btnleft.removeAttribute('pressed');
            btn.middle ? this.#btnmiddle.setAttribute('pressed', '') : this.#btnmiddle.removeAttribute('pressed');
            btn.right ? this.#btnright.setAttribute('pressed', '') : this.#btnright.removeAttribute('pressed');
        }

        this.#btnleft.addEventListener('pointerdown', e => {btn.left=true; btnchange()});
        this.#btnmiddle.addEventListener('pointerdown', e => {btn.middle=true; btnchange()});
        this.#btnright.addEventListener('pointerdown', e => {btn.right=true; btnchange()});

        this.#btnleft.addEventListener('pointerup', e => {btn.left=false; btnchange()});
        this.#btnmiddle.addEventListener('pointerup', e => {btn.middle=false; btnchange()});
        this.#btnright.addEventListener('pointerup', e => {btn.right=false; btnchange()});
    }

    doMove() {
        if (this.#lastpos) {
            SimpleDriver.move(this.#lastpos.x*100, this.#lastpos.y*100);
        }
    }

    async toggleConnection() {
        if (this.#connectbtn.className === 'connected') {
            SimpleDriver.disconnect();
        } else if (this.#connectbtn.className == 'disconnected') {
            try {
                this.#connectbtn.className = 'connecting';
                await SimpleDriver.scan();
            } catch(err) {
                this.#connectbtn.className = 'disconnected';
            }
        }
    }

    handleConnect() {
        this.#connectbtn.className = 'connected';
    }

    handleDisconnect() {
        this.#connectbtn.className = 'disconnected';
    }
}
customElements.define('main-app', MainApp);
