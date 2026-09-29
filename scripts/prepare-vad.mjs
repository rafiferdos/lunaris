import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { mkdir, copyFile, rm } from "node:fs/promises"
const require = createRequire(import.meta.url)
const vad = dirname(require.resolve("@ricky0123/vad-web"))
const vadRequire = createRequire(require.resolve("@ricky0123/vad-web"))
const ort = dirname(vadRequire.resolve("onnxruntime-web/wasm"))
const output = "public/vad"
// This directory contains generated package assets only. No third-party CDN is used at runtime.
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
for (const name of ["vad.worklet.bundle.min.js", "silero_vad_v5.onnx"])
  await copyFile(join(vad, name), join(output, name))
for (const name of [
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
])
  await copyFile(join(ort, name), join(output, name))
