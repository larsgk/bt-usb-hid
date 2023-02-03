// @ts-check

// SimpleDriver
//
// Supports:
//   * Mouse move and buttons
//

const SimpleMouseLinkUUID = '56beb2d8-64eb-4e33-96d4-e3f394041d0b';
const SimpleMouseMoveXYUUID = '83986548-8703-4272-a124-84abb9d03217';
const SimpleMouseVelocityXYUUID = '3cabb56e-27a7-45fa-996a-582f581d6aa3';
const SimpleMouseButtonsUUID = '5062c9c1-ca09-47f9-84f6-725ef8091bf9';

const cap_val = (val) => {
    let res = Math.max(-127, Math.min(127, Math.round(val)));
    return res
};

export const SimpleDriver = new class extends EventTarget {
    #device
    #writeFuncs

    constructor() {
        super();

        this.#device = null;
        this.#writeFuncs = {};
    }

    move(x, y) {
        if (this.#writeFuncs.move_xy) {
            const xx = cap_val(x);
            const yy = cap_val(y);
            console.log("Mouse move:", xx, yy)
            if (xx || yy) this.#writeFuncs.move_xy.writeValue(new Int8Array([xx, yy]));
        }
    }

    velocity(x, y) {
        if (this.#writeFuncs.velocity_xy) {
            const xx = Math.round(x);
            const yy = Math.round(y);
            console.log("Mouse velocity:", xx, yy)
            this.#writeFuncs.velocity_xy.writeValue(new Int16Array([xx, yy]));
        }
    }

    buttons(left, right, middle) {
        const btn = (left ? 1<<0 : 0) + (right ? 1<<1 : 0) + (middle ? 1<<2 : 0);
        if (this.#writeFuncs.buttons) {
            console.log("Mouse buttons:", left, right, middle)
            this.#writeFuncs.buttons.writeValue(new Uint8Array([btn]));
        }
    }

    async fetchWriteCharacteristics(server) {
        const service = await server.getPrimaryService(SimpleMouseLinkUUID);
        this.#writeFuncs.move_xy = await service.getCharacteristic(SimpleMouseMoveXYUUID);
        this.#writeFuncs.velocity_xy = await service.getCharacteristic(SimpleMouseVelocityXYUUID);
        this.#writeFuncs.buttons = await service.getCharacteristic(SimpleMouseButtonsUUID);
    }

    async openDevice(device) {
        const server = await device.gatt.connect();

        try {
            await this.fetchWriteCharacteristics(server);

            console.log('connected', device);
            this.dispatchEvent(new Event('connect'));

            device.ongattserverdisconnected = e => this._disconnected(e);

            this.#device = device;
        } catch (err) {
            console.warn(err);
        }
    }

    disconnect() {
        this.#device?.gatt?.disconnect();
    }

    _disconnected(evt) {
        this.#device = null;
        this.#writeFuncs = {};
        console.log('disconnected');
        this.dispatchEvent(new Event('disconnect'));
    }

    async scan() {
        const device = await navigator.bluetooth.requestDevice({
            filters: [
                { services: [SimpleMouseLinkUUID] },
                { name: 'Simple Mouse Link'}
                ]
        });

        if (device) {
            await this.openDevice(device);
        }
    }
}
