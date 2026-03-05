document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const SIGN_BITS = 1;
  const EXP_BITS = 8;
  const FRAC_BITS = 23;
  const TOTAL_BITS = 32;

  // DOM Elements
  const signBitsContainer = document.getElementById('sign-bits');
  const expBitsContainer = document.getElementById('exp-bits');
  const fracBitsContainer = document.getElementById('frac-bits');

  const calcSign = document.getElementById('calc-sign');
  const calcExp = document.getElementById('calc-exp');
  const calcFrac = document.getElementById('calc-frac');

  const valSign = document.getElementById('val-sign');
  const valExp = document.getElementById('val-exp');
  const valExpRaw = document.getElementById('val-exp-raw');
  const valFrac = document.getElementById('val-frac');

  const finalResult = document.getElementById('final-result');
  const hexResult = document.getElementById('hex-result');
  const specialCase = document.getElementById('special-case');

  // State
  let bits = new Array(TOTAL_BITS).fill(0);

  // Initialize UI
  function init() {
    createBitButtons(signBitsContainer, 0, SIGN_BITS, 'sign-bit');
    createBitButtons(expBitsContainer, SIGN_BITS, EXP_BITS, 'exp-bit');
    createBitButtons(fracBitsContainer, SIGN_BITS + EXP_BITS, FRAC_BITS, 'frac-bit');

    // Set an initial interesting value (e.g., 1.5)
    // 1.5 in IEEE 754: Sign=0, Exp=127 (01111111), Frac=0.5 (10000000000000000000000)
    // 0 01111111 10000000000000000000000
    setBitsFromBinaryString('00111111110000000000000000000000');

    updateCalculation();
  }

  function createBitButtons(container, startIndex, count, className) {
    for (let i = 0; i < count; i++) {
      const bitIndex = startIndex + i;
      const button = document.createElement('button');
      button.className = `bit-button ${className}`;
      button.dataset.index = bitIndex;
      button.textContent = '0';
      button.addEventListener('click', () => toggleBit(bitIndex, button));
      container.appendChild(button);
    }
  }

  function toggleBit(index, button) {
    bits[index] = bits[index] === 0 ? 1 : 0;
    updateButtonVisual(button, bits[index]);
    updateCalculation();
  }

  function updateButtonVisual(button, value) {
    button.textContent = value;
    if (value === 1) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  }

  function setBitsFromBinaryString(binaryString) {
    for (let i = 0; i < TOTAL_BITS; i++) {
      bits[i] = parseInt(binaryString[i], 10);
      const button = document.querySelector(`.bit-button[data-index="${i}"]`);
      if (button) {
        updateButtonVisual(button, bits[i]);
      }
    }
  }

  function getBitsAsInt(startIndex, length) {
    let result = 0;
    for (let i = 0; i < length; i++) {
      result = (result << 1) | bits[startIndex + i];
    }
    return result;
  }

  function getHexRepresentation() {
    let hex = '';
    for (let i = 0; i < TOTAL_BITS; i += 4) {
      const nibble = getBitsAsInt(i, 4);
      hex += nibble.toString(16);
    }
    return '0x' + hex.padStart(8, '0').toUpperCase();
  }

  function updateCalculation() {
    const signBit = bits[0];
    const rawExp = getBitsAsInt(SIGN_BITS, EXP_BITS);

    // Calculate fraction value manually
    let fractionVal = 0;
    for (let i = 0; i < FRAC_BITS; i++) {
      if (bits[SIGN_BITS + EXP_BITS + i] === 1) {
        fractionVal += Math.pow(2, -(i + 1));
      }
    }

    const sign = signBit === 1 ? -1 : 1;
    const isSubnormal = rawExp === 0;
    const isSpecial = rawExp === 255;
    const fractionBitsAllZero = fractionVal === 0;

    let exponentVal, mantissaVal, resultStr;
    let specialType = '';

    // Calculate formula parts
    if (isSpecial) {
      exponentVal = 'N/A';
      mantissaVal = 'N/A';
      if (fractionBitsAllZero) {
        resultStr = signBit === 1 ? '-Infinity' : '+Infinity';
        specialType = 'Infinity';
      } else {
        resultStr = 'NaN';
        specialType = 'Not a Number (NaN)';
      }
    } else if (isSubnormal) {
      if (fractionBitsAllZero) {
        resultStr = signBit === 1 ? '-0' : '0';
        specialType = 'Zero';
        exponentVal = -126;
        mantissaVal = 0;
      } else {
        specialType = 'Subnormal';
        exponentVal = -126;
        mantissaVal = fractionVal;

        // Calculate subnormal value
        const val = sign * mantissaVal * Math.pow(2, exponentVal);
        resultStr = val.toExponential(4);
      }
    } else {
      specialType = 'Normalized';
      exponentVal = rawExp - 127;
      mantissaVal = 1 + fractionVal;

      // Calculate normalized value using Float32Array to avoid JS precision issues
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, getBitsAsInt(0, 32), false); // Big endian
      const val = view.getFloat32(0, false);

      // Format nicely
      if (Math.abs(val) < 1e-6 || Math.abs(val) > 1e6) {
        resultStr = val.toExponential(6);
      } else {
        // Strip trailing zeros and avoid scientific notation for normal range
        resultStr = parseFloat(val.toPrecision(7)).toString();
      }
    }

    // Update UI elements
    calcSign.innerHTML = `(-1)<sup>${signBit}</sup>`;
    valSign.textContent = sign;

    valExpRaw.textContent = rawExp;

    if (isSubnormal && fractionBitsAllZero) {
      calcExp.innerHTML = `2<sup>0</sup>`;
      valExp.innerHTML = `0`;
      calcFrac.innerHTML = `(0)`;
      valFrac.textContent = `0`;
    } else if (isSubnormal) {
      calcExp.innerHTML = `2<sup>1 - 127</sup>`;
      valExp.innerHTML = `2<sup>-126</sup>`;
      calcFrac.innerHTML = `(0 + ${fractionVal.toFixed(6).replace(/0+$/, '')})`;
      valFrac.textContent = mantissaVal.toFixed(6).replace(/0+$/, '');
    } else if (isSpecial) {
       calcExp.innerHTML = `2<sup>255 - 127</sup>`;
       valExp.innerHTML = `N/A`;
       calcFrac.innerHTML = `(1 + ${fractionVal})`;
       valFrac.textContent = `N/A`;
    } else {
      calcExp.innerHTML = `2<sup>${rawExp} - 127</sup>`;
      valExp.innerHTML = `2<sup>${exponentVal}</sup>`;
      calcFrac.innerHTML = `(1 + ${fractionVal === 0 ? '0' : fractionVal.toFixed(6).replace(/0+$/, '')})`;
      valFrac.textContent = mantissaVal.toFixed(6).replace(/0+$/, '');
    }

    finalResult.textContent = resultStr;
    hexResult.textContent = getHexRepresentation();
    specialCase.textContent = specialType;
  }

  // Run initialization
  init();
});
