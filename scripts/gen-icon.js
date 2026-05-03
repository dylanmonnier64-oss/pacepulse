const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.18  // corner radius

  // --- Background: pure black rounded square ---
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#080808'
  ctx.fill()

  // Subtle inner glow at top
  const topGlow = ctx.createRadialGradient(size * 0.5, size * 0.1, 0, size * 0.5, size * 0.1, size * 0.6)
  topGlow.addColorStop(0, 'rgba(255,255,255,0.04)')
  topGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.clip()
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, size, size)
  ctx.restore()

  const fontSize = size * 0.65
  ctx.font = `900 ${fontSize}px "Georgia", "Times New Roman", serif`
  ctx.textBaseline = 'middle'

  const centerX = size * 0.5
  const centerY = size * 0.52

  // Measure a single "P"
  const metrics = ctx.measureText('P')
  const letterW = metrics.width

  // Offset so the two letters overlap nicely
  const overlap = letterW * 0.30
  const leftX = centerX - letterW * 0.5 - overlap * 0.5 + letterW * 0.05
  const rightX = centerX - letterW * 0.5 + overlap * 0.5 + letterW * 0.1

  // --- Right P (purple, drawn first so left P sits on top) ---
  const gradRight = ctx.createLinearGradient(rightX, centerY - fontSize * 0.5, rightX, centerY + fontSize * 0.5)
  gradRight.addColorStop(0, '#C8A0D8')
  gradRight.addColorStop(0.35, '#9B6BB5')
  gradRight.addColorStop(0.7, '#6B3A82')
  gradRight.addColorStop(1, '#3D1F50')
  ctx.fillStyle = gradRight
  ctx.fillText('P', rightX, centerY)

  // Edge highlight on right P (subtle lighter left border)
  const gradRightHL = ctx.createLinearGradient(rightX, 0, rightX + letterW * 0.08, 0)
  gradRightHL.addColorStop(0, 'rgba(200,160,220,0.35)')
  gradRightHL.addColorStop(1, 'rgba(200,160,220,0)')
  ctx.fillStyle = gradRightHL
  ctx.fillText('P', rightX, centerY)

  // --- Left P (gold) ---
  const gradLeft = ctx.createLinearGradient(leftX, centerY - fontSize * 0.5, leftX, centerY + fontSize * 0.5)
  gradLeft.addColorStop(0, '#F0E0A0')
  gradLeft.addColorStop(0.25, '#D4B86A')
  gradLeft.addColorStop(0.55, '#B8922A')
  gradLeft.addColorStop(0.8, '#8A6010')
  gradLeft.addColorStop(1, '#5C3D05')
  ctx.fillStyle = gradLeft
  ctx.fillText('P', leftX, centerY)

  // Subtle gold highlight on left edge of left P
  const gradLeftHL = ctx.createLinearGradient(leftX, 0, leftX + letterW * 0.06, 0)
  gradLeftHL.addColorStop(0, 'rgba(255,240,180,0.4)')
  gradLeftHL.addColorStop(1, 'rgba(255,240,180,0)')
  ctx.fillStyle = gradLeftHL
  ctx.fillText('P', leftX, centerY)

  return canvas.toBuffer('image/png')
}

const outDir = path.join(__dirname, '../public/icons')
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(path.join(outDir, 'icon-512.png'), drawIcon(512))
fs.writeFileSync(path.join(outDir, 'icon-192.png'), drawIcon(192))
fs.writeFileSync(path.join(outDir, 'icon-180.png'), drawIcon(180))

console.log('Icons generated: 512, 192, 180')
