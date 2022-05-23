// @ts-check

// SimpleDriver
//
// Supports:
//   * Mouse move and buttons
//

const SimpleMouseLinkUUID = '56beb2d8-64eb-4e33-96d4-e3f394041d0b';
const SimpleMouseMoveXYUUID = '83986548-8703-4272-a124-84abb9d03217';
const SimpleMouseButtonsUUID = '5062c9c1-ca09-47f9-84f6-725ef8091bf9';

const cap_val = (val) => {
    let res = Math.max(-127, Math.min(127, Math.round(val)));
    return res
};

export const SimpleDriver = new class extends EventTarget {
    #device
    #writeFuncs = {};

    constructor() {
        super();
    }

    move = (x, y) => {
        if (this.#writeFuncs.move_xy) {
            let xx = cap_val(x);
            let yy = cap_val(y);
            console.log("Try to move ", xx, yy)
            if (xx || yy) this.#writeFuncs.move_xy.writeValue(new Uint8Array([xx, yy]));
        }
    };

    buttons = (left, right, middle) => {
        const btn = (left ? 1<<0 : 0) + (right ? 1<<1 : 0) + (middle ? 1<<2 : 0);
        if (this.#writeFuncs.buttons) {
            console.log("Mouse buttons:", left, right, middle)
            this.#writeFuncs.buttons.writeValue(new Uint8Array([btn]));
        }
    }

    fetchWriteCharacteristics = async (server) => {
        const service = await server.getPrimaryService(SimpleMouseLinkUUID);
        this.#writeFuncs.move_xy = await service.getCharacteristic(SimpleMouseMoveXYUUID);
        this.#writeFuncs.buttons = await service.getCharacteristic(SimpleMouseButtonsUUID);
    };

    openDevice = async (device) => {
        const server = await device.gatt.connect();

        try {
            await this.fetchWriteCharacteristics(server);

            console.log('connected', device);
            this.dispatchEvent(new Event('connect'));

            this.#device = device;
        } catch (err) {
            console.warn(err);
        }
    };

    disconnect() {
        this.#device?.gatt?.disconnect();
        this.#device = undefined;
    }

    _disconnected(evt) {
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
