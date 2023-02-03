#ifndef BT_SIMPLE_MOUSE_SERVICE_H_
#define BT_SIMPLE_MOUSE_SERVICE_H_

#include <zephyr/types.h>

#ifdef __cplusplus
extern "C" {
#endif

// 56beb2d8-64eb-4e33-96d4-e3f394041d0b (service)
// 83986548-8703-4272-a124-84abb9d03217 (move x & y)
// 3cabb56e-27a7-45fa-996a-582f581d6aa3 (velocity x & y)
// 5062c9c1-ca09-47f9-84f6-725ef8091bf9 (buttons)

#define BT_UUID_SIMPLE_MOUSE_SERVICE \
	BT_UUID_128_ENCODE(0x56beb2d8, 0x64eb, 0x4e33, 0x96d4, 0xe3f394041d0b)

typedef void (*simple_mouse_move_xy_cb)(int8_t distx, int8_t disty);
typedef void (*simple_mouse_velocity_xy_cb)(int16_t vx, int16_t vy);
typedef void (*simple_mouse_buttons_cb)(uint8_t buttons);

struct bt_simple_mouse_cb {
    simple_mouse_move_xy_cb     move_xy;
    simple_mouse_velocity_xy_cb velocity_xy;
    simple_mouse_buttons_cb     buttons;
};

void bt_simple_mouse_register_cb(struct bt_simple_mouse_cb *cb);

#ifdef __cplusplus
}
#endif

#endif /* BT_SIMPLE_MOUSE_SERVICE_H_ */
