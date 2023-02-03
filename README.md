EARLY PROTO/DRAFT :)

## Simple Mouse

A small post about the project can be found [here](https://dev.to/denladeside/zephyr-web-bluetooth-and-accessibility-4ddm)

This project contains firmware to make a bridge between a standard USB HID mouse and
a very simplified BLE GATT service.

The GATT service exposes characteristics to control mouse movement and button presses.

Besides the [main example web app](https://larsgk.github.io/bt-usb-hid/index.html), there is also a [very simple example](https://larsgk.github.io/bt-usb-hid/testkb.html) web application that creates a feedback from keyboard key presses over BLE GATT, resulting in mouse movements/button presses:

* A,S,D,W = movement
* 1,2,3 = left, middle, right buttons


## Flashing hardware

* Install nrfutil (see [here](https://docs.zephyrproject.org/latest/boards/arm/nrf52840dongle_nrf52840/doc/index.html)).
* Download the latest release zip file from [here](https://github.com/larsgk/bt-usb-hid/releases)
* Insert the dongle, press the tiny side/DFU button to enable DFU mode (board starts flashing red) and write:

```
nrfutil dfu serial -pkg SimpleMouse_nRF52840Dongle.zip -p /dev/ttyACM0
```

NOTE: `/dev/ttyACM0` might be named different on your system (see the zephyr documentation linked above for nrfutil)