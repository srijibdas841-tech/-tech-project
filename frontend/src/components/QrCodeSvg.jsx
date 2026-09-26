import React, { useMemo } from 'react';

/**
 * Pure JavaScript QR Code Generator (QR Code Model 2, Byte Encoding, Error Correction M)
 * 100% Self-contained - zero external dependencies, renders crisp scalable vector SVG.
 */

// GF(256) Galois Field tables
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsCompute(data, ecCount) {
  // Compute Reed-Solomon generator polynomial for ecCount
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gfMul(gen[j], EXP_TABLE[i]);
      nextGen[j + 1] ^= gen[j];
    }
    gen = nextGen;
  }

  // Polynomial division
  const remainder = new Array(ecCount).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return remainder;
}

// QR Table: [version, totalBytes, ecBytes, dataBytes, dimension] (Level M)
const QR_SPECS = [
  { version: 1, total: 26, ec: 10, data: 16, size: 21 },
  { version: 2, total: 44, ec: 16, data: 28, size: 25 },
  { version: 3, total: 70, ec: 26, data: 44, size: 29 },
  { version: 4, total: 100, ec: 36, data: 64, size: 33 },
  { version: 5, total: 134, ec: 48, data: 86, size: 37 },
  { version: 6, total: 172, ec: 64, data: 108, size: 41 },
  { version: 7, total: 196, ec: 72, data: 124, size: 45 },
  { version: 8, total: 242, ec: 88, data: 154, size: 49 },
];

function generateQrMatrix(text) {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  
  // Find appropriate version
  let spec = null;
  for (const s of QR_SPECS) {
    // Byte mode overhead: 4 bits mode + 8 bits length count = 12 bits (1.5 bytes)
    if (rawBytes.length + 2 <= s.data) {
      spec = s;
      break;
    }
  }
  if (!spec) spec = QR_SPECS[QR_SPECS.length - 1];

  // Bit buffer: Mode byte (0010 = 2), length (8 bits), data bytes, terminator
  const bits = [];
  const pushBits = (val, count) => {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  pushBits(2, 4); // Byte mode indicator
  pushBits(Math.min(rawBytes.length, spec.data - 2), 8); // Character count
  for (let i = 0; i < Math.min(rawBytes.length, spec.data - 2); i++) {
    pushBits(rawBytes[i], 8);
  }
  // Terminator
  while (bits.length < spec.data * 8 && bits.length % 8 !== 0) {
    bits.push(0);
  }
  while (bits.length < spec.data * 8 && bits.length <= (spec.data * 8 - 4)) {
    pushBits(0, 4);
    break;
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert bits to byte array
  const dataBytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | (bits[i + b] || 0);
    }
    dataBytes.push(byte);
  }

  // Pad data with alternating 0xEC, 0x11
  const pad = [0xec, 0x11];
  let pIdx = 0;
  while (dataBytes.length < spec.data) {
    dataBytes.push(pad[pIdx % 2]);
    pIdx++;
  }

  // Error correction
  const ecCodewords = rsCompute(dataBytes, spec.ec);
  const finalCodewords = dataBytes.concat(ecCodewords);

  // Initialize N x N matrix (-1 = unset)
  const size = spec.size;
  const matrix = Array.from({ length: size }, () => new Array(size).fill(-1));
  const isReserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setModule = (r, c, val, reserve = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0;
      if (reserve) isReserved[r][c] = true;
    }
  };

  // 1. Finder patterns (7x7) at 3 corners + 1 module separator
  const placeFinder = (startR, startC) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startR + r;
        const nc = startC + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setModule(nr, nc, inOuter && (isBorder || isCore));
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // 2. Alignment patterns for version >= 2
  if (spec.version >= 2) {
    const alignCoords = [spec.size - 7];
    for (const ar of alignCoords) {
      for (const ac of alignCoords) {
        if (!isReserved[ar][ac]) {
          for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
              const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
              const isCenter = r === 0 && c === 0;
              setModule(ar + r, ac + c, isBorder || isCenter);
            }
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setModule(4 * spec.version + 9, 8, 1);

  // 5. Reserve format info
  for (let i = 0; i <= 8; i++) {
    if (i <= 5) isReserved[i][8] = isReserved[8][i] = true;
    if (i === 7 || i === 8) isReserved[i][8] = isReserved[8][i] = true;
    isReserved[size - 1 - i][8] = true;
    if (i < 8) isReserved[8][size - 1 - i] = true;
  }

  // 6. Data Placement in zigzag vertical 2-column tracks
  let bitIdx = 0;
  const totalDataBits = finalCodewords.length * 8;
  const getNextBit = () => {
    if (bitIdx >= totalDataBits) return 0;
    const byte = finalCodewords[Math.floor(bitIdx / 8)];
    const bit = (byte >> (7 - (bitIdx % 8))) & 1;
    bitIdx++;
    return bit;
  };

  let upwards = true;
  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip vertical timing column
    const rows = [];
    if (upwards) {
      for (let r = size - 1; r >= 0; r--) rows.push(r);
    } else {
      for (let r = 0; r < size; r++) rows.push(r);
    }

    for (const r of rows) {
      for (let c = rightCol; c >= rightCol - 1; c--) {
        if (!isReserved[r][c]) {
          const bitVal = getNextBit();
          // Mask 0: (row + col) % 2 === 0
          const maskInvert = (r + c) % 2 === 0;
          matrix[r][c] = maskInvert ? (bitVal ^ 1) : bitVal;
        }
      }
    }
    upwards = !upwards;
  }

  // 7. Format Information (Level M = 00, Mask 0 = 000 -> 00000 with BCH 10100110111 = 0x5412)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 15; i++) {
    const val = formatBits[i];
    // Around top-left
    if (i < 6) matrix[8][i] = val;
    else if (i === 6) matrix[8][7] = val;
    else if (i === 7) matrix[8][8] = val;
    else if (i === 8) matrix[7][8] = val;
    else matrix[14 - i][8] = val;

    // Second copy (split between bottom-left and top-right)
    if (i < 7) {
      matrix[size - 1 - i][8] = val;
    } else {
      matrix[8][size - 15 + i] = val;
    }
  }

  return matrix;
}

export default function QrCodeSvg({ 
  value = '', 
  size = 140, 
  fgColor = '#0f4c81', 
  bgColor = '#ffffff',
  includeMargin = true,
  onClick = null,
  title = 'Scan to verify certificate'
}) {
  const matrix = useMemo(() => {
    try {
      return generateQrMatrix(value || 'BHOOMI-TRUST-CERTIFICATE');
    } catch (err) {
      console.error('QR generation error:', err);
      return [];
    }
  }, [value]);

  const moduleCount = matrix.length;
  if (moduleCount === 0) return null;

  const margin = includeMargin ? 3 : 0;
  const viewBoxSize = moduleCount + margin * 2;

  // Build rects
  const rects = [];
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] === 1) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c + margin}
            y={r + margin}
            width={1.02}
            height={1.02}
            fill={fgColor}
          />
        );
      }
    }
  }

  return (
    <div 
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: bgColor,
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onClick={onClick}
      title={title}
      className={onClick ? 'qr-clickable' : ''}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ display: 'block', shapeRendering: 'crispEdges' }}
      >
        <rect width={viewBoxSize} height={viewBoxSize} fill={bgColor} />
        {rects}
      </svg>
      {onClick && (
        <span style={{ fontSize: '10px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
          Click to Verify
        </span>
      )}
    </div>
  );
}
