/*
 * Copyright (c) 2022 Lars Knudsen
 * (derived from the hid-mouse sample by:)
 * Copyright (c) 2018 qianfan Zhao
 * Copyright (c) 2018 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: Apache-2.0
 */

#include <zephyr/kernel.h>

#include <zephyr/usb/usb_device.h>
#include <zephyr/usb/class/usb_hid.h>

#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/gatt.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/bluetooth/uuid.h>

#include "simplems.h"

static const struct bt_data ad[] = {
	BT_DATA_BYTES(BT_DATA_FLAGS, (BT_LE_AD_GENERAL | BT_LE_AD_NO_BREDR)),
	BT_DATA_BYTES(BT_DATA_UUID128_ALL, BT_UUID_SIMPLE_MOUSE_SERVICE),
};

static const uint8_t hid_report_desc[] = HID_MOUSE_REPORT_DESC(3);

static volatile uint8_t status[4];
static K_SEM_DEFINE(sem, 0, 1);	/* starts off "not available" */
static enum usb_dc_status_code usb_status;

#define MOUSE_BTN_REPORT_POS	0
#define MOUSE_X_REPORT_POS		1
#define MOUSE_Y_REPORT_POS		2

#define MOUSE_BTN_LEFT		BIT(0)
#define MOUSE_BTN_RIGHT		BIT(1)
#define MOUSE_BTN_MIDDLE	BIT(2)

static void status_cb(enum usb_dc_status_code status, const uint8_t *param)
{
	usb_status = status;
}

static void sm_move_xy_cb(int8_t distx, int8_t disty) {
	printk("Move (x,y) = (%d, %d)\n", distx, disty);

	uint8_t statex = status[MOUSE_X_REPORT_POS];
	uint8_t statey = status[MOUSE_Y_REPORT_POS];

	statex += distx;
	statey += disty;

	if (status[MOUSE_X_REPORT_POS] != statex || status[MOUSE_Y_REPORT_POS] != statey) {
		status[MOUSE_X_REPORT_POS] = statex;
		status[MOUSE_Y_REPORT_POS] = statey;
		k_sem_give(&sem);
	}
}

static void sm_buttons_cb(uint8_t buttons)
{
	printk("Buttons (LEFT, MIDDLE, RIGHT) = (%s, %s, %s)\n",
		(buttons & MOUSE_BTN_LEFT) ? "DOWN" : "UP",
		(buttons & MOUSE_BTN_MIDDLE) ? "DOWN" : "UP",
		(buttons & MOUSE_BTN_RIGHT) ? "DOWN" : "UP");

	uint8_t state = buttons & 0x7;

	if (IS_ENABLED(CONFIG_USB_DEVICE_REMOTE_WAKEUP)) {
		if (usb_status == USB_DC_SUSPEND) {
			usb_wakeup_request();
			return;
		}
	}

	if (status[MOUSE_BTN_REPORT_POS] != state) {
		status[MOUSE_BTN_REPORT_POS] = state;
		k_sem_give(&sem);
	}
}

// Velocity is ~ *2 px/s
static int32_t _dx;
static int32_t _dy;
static int16_t _vx;
static int16_t _vy;

static void sm_velocity_xy_cb(int16_t vx, int16_t vy) {
	printk("Velocity (x,y) = (%d, %d)\n", vx, vy);

	_vx = vx;
	_vy = vy;
}

#define ABS(x)	(x > 0 ? x : -x)

static int16_t overflow(uint32_t *delta, uint16_t velocity)
{
	int16_t overflow;
	*delta += velocity;

	overflow = *delta / 256;

	*delta = *delta % 0xff;

	return overflow;
}

void apply_velocity(struct k_timer *dummy)
{
	int8_t mx;
	int8_t my;

	mx = (int8_t)overflow(&_dx, _vx);
	my = (int8_t)overflow(&_dy, _vy);

	if (mx || my) {
		sm_move_xy_cb(mx, my);
	}
}

K_TIMER_DEFINE(velocity_timer, apply_velocity, NULL);


struct bt_simple_mouse_cb sm_cbs = {
	.move_xy = sm_move_xy_cb,
	.velocity_xy = sm_velocity_xy_cb,
	.buttons = sm_buttons_cb,
};

static void bt_ready(void)
{
	int err;

	printk("Bluetooth initialized\n");

	bt_simple_mouse_register_cb(&sm_cbs);

	err = bt_le_adv_start(BT_LE_ADV_CONN_NAME, ad, ARRAY_SIZE(ad), NULL, 0);
	if (err) {
		printk("Advertising failed to start (err %d)\n", err);
		return;
	}

	printk("Advertising successfully started\n");
}

static void connected(struct bt_conn *conn, uint8_t err)
{
	if (err) {
		printk("Connection failed (err 0x%02x)\n", err);
	} else {
		printk("Connected\n");
		_dx = 0;
		_dy = 0;
		k_timer_start(&velocity_timer, K_MSEC(8), K_MSEC(8));
	}
}

static void disconnected(struct bt_conn *conn, uint8_t reason)
{
	printk("Disconnected (reason 0x%02x)\n", reason);
	k_timer_stop(&velocity_timer);
}

BT_CONN_CB_DEFINE(conn_callbacks) = {
	.connected = connected,
	.disconnected = disconnected,
};

void main(void)
{
	int err;
	uint8_t report[4] = { 0x00 };
	const struct device *hid_dev;

	hid_dev = device_get_binding("HID_0");
	if (hid_dev == NULL) {
		printk("Cannot get USB HID Device\n");
		return;
	}

	usb_hid_register_device(hid_dev,
				hid_report_desc, sizeof(hid_report_desc),
				NULL);

	usb_hid_init(hid_dev);

	err = usb_enable(status_cb);
	if (err != 0) {
		printk("Failed to enable USB\n");
		return;
	}

	// Enable BT
	err = bt_enable(NULL);
	if (err) {
		printk("Bluetooth init failed (err %d)\n", err);
		return;
	}

	bt_ready();

	while (true) {
		k_sem_take(&sem, K_FOREVER);

		report[MOUSE_BTN_REPORT_POS] = status[MOUSE_BTN_REPORT_POS];
		report[MOUSE_X_REPORT_POS] = status[MOUSE_X_REPORT_POS];
		status[MOUSE_X_REPORT_POS] = 0U;
		report[MOUSE_Y_REPORT_POS] = status[MOUSE_Y_REPORT_POS];
		status[MOUSE_Y_REPORT_POS] = 0U;
		err = hid_int_ep_write(hid_dev, report, sizeof(report), NULL);
		if (err) {
			printk("HID write error, %d\n", err);
		}
	}
}
