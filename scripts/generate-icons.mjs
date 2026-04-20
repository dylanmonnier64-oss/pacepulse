// Run: node scripts/generate-icons.mjs
// Requires: npm install canvas (optional) OR uses a pure-JS approach

import { createCanvas } from "canvas"
import { writeFileSync, mkdirSync } from "fs"

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")

  // Background
  ctx.fillStyle = "#0A0A0A"
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Gradient circle
  const grad = ctx.createRadialGradient(size * 0.5, size * 0.4, 0, size * 0.5, size * 0.5, size * 0.45)
  grad.addColorStop(0, "#F4D03F")
  grad.addColorStop(0.5, "#E67E22")
  grad.addColorStop(1, "#9B59B6")

  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(size * 0.5, size * 0.45, size * 0.3, 0, Math.PI * 2)
  ctx.fill()

  // PP letters
  ctx.fillStyle = "#0A0A0A"
  ctx.font = `bold ${size * 0.28}px -apple-system, Arial`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("PP", size * 0.5, size * 0.46)

  return canvas.toBuffer("image/png")
}

mkdirSync("public/icons", { recursive: true })
writeFileSync("public/icons/icon-192.png", generateIcon(192))
writeFileSync("public/icons/icon-512.png", generateIcon(512))
console.log("Icons generated ✓")
