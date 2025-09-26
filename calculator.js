document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const converterInputs = {
        decimal: document.getElementById('decimal'),
        hexadecimal: document.getElementById('hexadecimal'),
        octal: document.getElementById('octal'),
        binary: document.getElementById('binary'),
    };
    const clearBtn = document.getElementById('clear-btn');
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIconContainer = document.getElementById('theme-icon-container');

    // Bitwise elements
    const operandAInput = document.getElementById('operand-a');
    const operandBInput = document.getElementById('operand-b');
    const opButtons = document.querySelectorAll('.btn-op');
    const bitwiseResultEl = document.getElementById('bitwise-result');
    
    // Char converter elements
    const charInput = document.getElementById('char-input');
    const charResultEl = document.getElementById('char-result');

    // Copy buttons
    const copyBtns = document.querySelectorAll('.copy-btn');

    // --- Regular Expressions for Validation ---
    const validationRegex = {
        decimal: /^[0-9]+$/,
        hexadecimal: /^[0-9a-fA-F]+$/,
        octal: /^[0-7]+$/,
        binary: /^[01]+$/,
        decSigned: /^-?[0-9]+$/, // For bitwise inputs
    };

    // --- Theme Management ---
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIconContainer.innerHTML = sunIcon;
        } else {
            document.documentElement.classList.remove('dark');
            themeIconContainer.innerHTML = moonIcon;
        }
    };

    const toggleTheme = () => {
        themeIconContainer.classList.add('rotate');
        const currentTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
        setTimeout(() => themeIconContainer.classList.remove('rotate'), 600);
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    // --- Base Converter Logic ---
    const handleBaseConversion = (event) => {
        const sourceInput = event.target;
        const sourceId = sourceInput.id;
        const sourceValue = sourceInput.value.trim();
        sourceInput.classList.remove('is-invalid');

        if (sourceValue === '') {
            clearAllConverterInputs();
            return;
        }

        if (!validationRegex[sourceId].test(sourceValue)) {
            sourceInput.classList.add('is-invalid');
            return;
        }

        let decimalValue;
        try {
            switch (sourceId) {
                case 'decimal': decimalValue = BigInt(sourceValue); break;
                case 'hexadecimal': decimalValue = BigInt('0x' + sourceValue); break;
                case 'octal': decimalValue = BigInt('0o' + sourceValue); break;
                case 'binary': decimalValue = BigInt('0b' + sourceValue); break;
            }
        } catch (error) {
            sourceInput.classList.add('is-invalid');
            return;
        }
        updateConverterInputs(sourceId, decimalValue);
    };

    const updateConverterInputs = (sourceId, decimalValue) => {
        if (sourceId !== 'decimal') converterInputs.decimal.value = decimalValue.toString(10);
        if (sourceId !== 'hexadecimal') converterInputs.hexadecimal.value = decimalValue.toString(16).toUpperCase();
        if (sourceId !== 'octal') converterInputs.octal.value = decimalValue.toString(8);
        if (sourceId !== 'binary') converterInputs.binary.value = decimalValue.toString(2);
    };
    
    const clearAllConverterInputs = () => {
        for (const key in converterInputs) {
            converterInputs[key].value = '';
            converterInputs[key].classList.remove('is-invalid');
        }
    };

    // --- Bitwise Operations Logic ---
    const handleBitwiseOp = (event) => {
        const operation = event.target.dataset.op;
        const valA = operandAInput.value.trim();
        const valB = operandBInput.value.trim();

        [operandAInput, operandBInput].forEach(inp => inp.classList.remove('is-invalid'));
        
        if (!validationRegex.decSigned.test(valA) || (operation !== 'not' && !validationRegex.decSigned.test(valB))) {
             if (!validationRegex.decSigned.test(valA)) operandAInput.classList.add('is-invalid');
             if (operation !== 'not' && !validationRegex.decSigned.test(valB)) operandBInput.classList.add('is-invalid');
             bitwiseResultEl.innerHTML = 'Invalid decimal input.';
             return;
        }
        
        try {
            const numA = BigInt(valA);
            const numB = (operation !== 'not') ? BigInt(valB) : 0n;
            let result;

            switch (operation) {
                case 'and': result = numA & numB; break;
                case 'or': result = numA | numB; break;
                case 'xor': result = numA ^ numB; break;
                case 'lshift': result = numA << numB; break;
                case 'rshift': result = numA >> numB; break;
                case 'not':
                    const bitLength = BigInt(document.querySelector('input[name="bit-length"]:checked').value);
                    const mask = (2n ** bitLength) - 1n;
                    result = numA & mask; // Ensure it's within bit length before NOT
                    result = ~result & mask; // Apply NOT and mask again
                    break;
                default: throw new Error('Unknown operation');
            }
            displayBitwiseResult(result);
        } catch (error) {
            bitwiseResultEl.innerHTML = 'Error in calculation.';
        }
    };
    
    const displayBitwiseResult = (decimalValue) => {
        bitwiseResultEl.innerHTML = `
            <span><strong>Dec:</strong> ${decimalValue.toString(10)}</span>
            <span><strong>Hex:</strong> 0x${decimalValue.toString(16).toUpperCase()}</span>
            <span><strong>Bin:</strong> 0b${decimalValue.toString(2)}</span>
        `;
    };
    
    // --- Character Converter Logic ---
    const handleCharConversion = () => {
        const char = charInput.value;
        if (char.length !== 1) {
            charResultEl.innerHTML = 'Enter a single character to see its codes.';
            return;
        }
        const decimalValue = BigInt(char.charCodeAt(0));
        charResultEl.innerHTML = `
            <span><strong>Dec:</strong> ${decimalValue.toString(10)}</span>
            <span><strong>Hex:</strong> 0x${decimalValue.toString(16).toUpperCase()}</span>
            <span><strong>Oct:</strong> 0o${decimalValue.toString(8)}</span>
            <span><strong>Bin:</strong> 0b${decimalValue.toString(2)}</span>
        `;
    };
    
    // --- Copy to Clipboard Logic ---
    const copyToClipboard = (event) => {
        const btn = event.currentTarget;
        const targetId = btn.dataset.target;
        const inputToCopy = document.getElementById(targetId);

        if (inputToCopy && inputToCopy.value) {
            navigator.clipboard.writeText(inputToCopy.value).then(() => {
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }
    };

    // --- Event Listeners ---
    for (const key in converterInputs) {
        converterInputs[key].addEventListener('input', handleBaseConversion);
    }
    
    clearBtn.addEventListener('click', clearAllConverterInputs);
    themeSwitcher.addEventListener('click', toggleTheme);

    opButtons.forEach(button => button.addEventListener('click', handleBitwiseOp));
    charInput.addEventListener('input', handleCharConversion);
    copyBtns.forEach(button => button.addEventListener('click', copyToClipboard));
});