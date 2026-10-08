#include "active/boxing-controller/Press.h"
#include <cassert>
int main() {
 PressDebounce b; b.reset(false,0); assert(!b.sample(false,35));
 assert(!b.sample(true,40)); assert(!b.sample(false,45)); assert(!b.sample(true,50));
 assert(!b.sample(true,84)); assert(b.sample(true,85)); assert(!b.sample(true,500));
 assert(!b.sample(false,510)); assert(!b.sample(false,545));
 assert(!b.sample(true,550)); assert(b.sample(true,585));
 b.reset(true,1000); assert(!b.sample(true,2000));
 assert(!b.sample(false,2010)); assert(!b.sample(false,2045));
 assert(!b.sample(true,2050)); assert(b.sample(true,2085));
 b.reset(false,0xfffffff0u); assert(!b.sample(false,30)); assert(!b.sample(true,40)); assert(b.sample(true,75));
}
