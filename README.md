EARLY PROTO/DRAFT :)

## Simple HID Link

This project contains firmware to make a bridge between a standard USB HID mouse and
a very simplified BLE GATT service.

The GATT service exposes characteristics to control mouse movement and button presses.

Besides the [main example web app](https://larsgk.github.io/bt-usb-hid/index.html), there is also a [very simple example](https://larsgk.github.io/bt-usb-hid/testkb.html) web application that creates a feedback from keyboard key presses over BLE GATT, resulting in mouse movements/button presses:

* A,S,D,W = movement
* 1,2,3 = left, middle, right buttons
