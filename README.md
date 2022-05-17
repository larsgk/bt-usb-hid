EARLY PROTO/DRAFT :)

## Simple HID Link

This project contains firmware to make a bridge between a standard USB HID mouse and
a very simplified BLE GATT service.

The GATT service exposes characteristics to control mouse movement and button presses.

There is also a very simple example web application that creates a feedback from keyboard
key presses over BLE GATT, resulting in mouse movements/button presses:

* A,S,D,W = movement
* 1,2,3 = left, middle, right buttons
