#pragma once
#include <stdint.h>
// Active-low switch, no repeat, and no held press after ARM/reset.
struct PressDebounce {
  bool raw = false, stable = false, armed = false;
  uint32_t changed = 0;
  void reset(bool pressed, uint32_t now) { raw = stable = pressed; armed = false; changed = now; }
  bool sample(bool pressed, uint32_t now) {
    if (pressed != raw) { raw = pressed; changed = now; }
    if (static_cast<uint32_t>(now - changed) < 35) return false;
    if (stable == raw) { if (!stable) armed = true; return false; }
    stable = raw;
    if (!stable) { armed = true; return false; }
    const bool fire = armed; armed = false; return fire;
  }
};
