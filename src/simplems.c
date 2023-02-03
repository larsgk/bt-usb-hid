#include <stddef.h>
#include <string.h>
#include <errno.h>
#include <zephyr/kernel.h>
#include <zephyr/init.h>
#include <zephyr/types.h>

#include <zephyr/bluetooth/bluetooth.h>
#include <zephyr/bluetooth/hci.h>
#include <zephyr/bluetooth/conn.h>
#include <zephyr/bluetooth/uuid.h>
#include <zephyr/bluetooth/gatt.h>

#include "simplems.h"

static struct bt_uuid_128 simplems_uuid = BT_UUID_INIT_128(
	BT_UUID_SIMPLE_MOUSE_SERVICE);

// 0x56beb2d8, 0x64eb, 0x4e33, 0x96d4, 0xe3f394041d0b  (svc)
// 0x83986548, 0x8703, 0x4272, 0xa124, 0x84abb9d03217  (move xy)
// 0x3cabb56e, 0x27a7, 0x45fa, 0x996a, 0x582f581d6aa3  (velocity xy)
// 0x5062c9c1, 0xca09, 0x47f9, 0x84f6, 0x725ef8091bf9  (btn)

static const struct bt_uuid_128 simplems_move_xy_uuid = BT_UUID_INIT_128(
	BT_UUID_128_ENCODE(0x83986548, 0x8703, 0x4272, 0xa124, 0x84abb9d03217));

static const struct bt_uuid_128 simplems_velocity_xy_uuid = BT_UUID_INIT_128(
	BT_UUID_128_ENCODE(0x3cabb56e, 0x27a7, 0x45fa, 0x996a, 0x582f581d6aa3));

static const struct bt_uuid_128 simplems_buttons_uuid = BT_UUID_INIT_128(
	BT_UUID_128_ENCODE(0x5062c9c1, 0xca09, 0x47f9, 0x84f6, 0x725ef8091bf9));


static struct bt_simple_mouse_cb *sm_cbs;

void bt_simple_mouse_register_cb(struct bt_simple_mouse_cb *cb)
{
    sm_cbs = cb;
}

static ssize_t write_move_xy(struct bt_conn *conn,
			      const struct bt_gatt_attr *attr,
			      const void *buf, uint16_t len,
			      uint16_t offset, uint8_t flags)
{
	int8_t val[2];

	if (offset != 0) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_OFFSET);
	} else if (len != sizeof(val)) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_ATTRIBUTE_LEN);
	}

	(void)memcpy(&val, buf, len);

    if (sm_cbs->move_xy) {
        sm_cbs->move_xy(val[0], val[1]);
    }

    return len;
}

static ssize_t write_velocity_xy(struct bt_conn *conn,
			      const struct bt_gatt_attr *attr,
			      const void *buf, uint16_t len,
			      uint16_t offset, uint8_t flags)
{
	int16_t val[2];

	if (offset != 0) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_OFFSET);
	} else if (len != sizeof(val)) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_ATTRIBUTE_LEN);
	}

	(void)memcpy(&val, buf, len);

    if (sm_cbs->velocity_xy) {
        sm_cbs->velocity_xy(val[0], val[1]);
    }

    return len;
}

static ssize_t write_buttons(struct bt_conn *conn,
			      const struct bt_gatt_attr *attr,
			      const void *buf, uint16_t len,
			      uint16_t offset, uint8_t flags)
{
	uint8_t val;

	if (offset != 0) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_OFFSET);
	} else if (len != sizeof(val)) {
		return BT_GATT_ERR(BT_ATT_ERR_INVALID_ATTRIBUTE_LEN);
	}

	(void)memcpy(&val, buf, len);

    if (sm_cbs->buttons) {
        sm_cbs->buttons(val);
    }

    return len;
}

/* Simple Mouse Service Declaration */
BT_GATT_SERVICE_DEFINE(sm_svc,
	BT_GATT_PRIMARY_SERVICE(&simplems_uuid),
    BT_GATT_CHARACTERISTIC(&simplems_move_xy_uuid.uuid, BT_GATT_CHRC_WRITE,
                BT_GATT_PERM_WRITE,
                NULL, write_move_xy, NULL),
    BT_GATT_CUD("Move XY", BT_GATT_PERM_READ),
    BT_GATT_CHARACTERISTIC(&simplems_velocity_xy_uuid.uuid, BT_GATT_CHRC_WRITE,
                BT_GATT_PERM_WRITE,
                NULL, write_velocity_xy, NULL),
    BT_GATT_CUD("Velocity XY", BT_GATT_PERM_READ),
    BT_GATT_CHARACTERISTIC(&simplems_buttons_uuid.uuid, BT_GATT_CHRC_WRITE,
                BT_GATT_PERM_WRITE,
                NULL, write_buttons, NULL),
    BT_GATT_CUD("Buttons", BT_GATT_PERM_READ),
);
