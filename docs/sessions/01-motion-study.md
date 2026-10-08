# Session 01b — Motion study before hardware connection

Read PRODUCT.md, docs/DESIGN-BRIEF.md, docs/design/CONCEPT-REVIEW.md and docs/design/MOTION-CONTRACT.md. Preserve the accepted toy fighters, ring, camera and three-control rail. The user accepted the design and asked for text-free walls/placards, approximately half the crowd, minimal repetition and the smoothest motion we can measure.

Build a clearly labelled keyboard/pointer animation study with one player and one rival. Use the revised normal, counter and Super reference frames, not a new visual discovery round. Animate actual 3D fighters; do not pan a concept bitmap as gameplay. Scripted outcomes may test hit/block/whiff, but are not complete combat.

Focus on planted feet, punch weight, continuous blending, context-aware variation, stamina/recovery expression and bounded event feedback. Demonstrate all four punches/four powers plus stance changes, stagger and Super. Keep environmental signage free of words and limit spectators to roughly half the original concept density.

Follow the motion contract's verification and capture real laptop measurements before claiming smoothness. Keep controller/firmware changes for session 02. Record authored animations, measured performance, limitations and the next implementation dependency. This study may be replaced by the combat event adapter later without giving animation completion authority over damage.

## Implemented handoff — 2026-10-04

The keyboard/pointer study is running at localhost:5174. It uses live articulated geometry, planted sole contacts, quaternion/position damping, power/fatigue-aware poses, three visual strike offsets and independent idle rhythms. Semantic impact feedback follows the striking glove; Super uses short pooled local trails. The scene preloads its texture and compiles shaders before controls enable, suspends hidden rendering, and disposes shared resources.

The study is deliberately scripted. Final hurt-volume rules, opponent decision logic, campaign, audio variation bank and ESP32 push/relay integration remain later milestones. See docs/design/IMPLEMENTATION.md for verification evidence and limits.
