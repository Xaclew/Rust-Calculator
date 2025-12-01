// We import the types from the generated .d.ts file, which gives us
// type safety for the Rust functions and enums.
import init, { calculate, Operation } from './wasm-calculator/pkg/wasm_calculator.js';

// --- DOM elements (No change here) ---
const display = document.getElementById('display') as HTMLElement;
const buttons = document.querySelectorAll('.calc-btn');

// --- Calculator State (Typed for safety) ---
let currentInput: string = '0';
let previousValue: number | null = null;
let operation: keyof typeof RustOperation | null = null;
let waitingForSecondOperand: boolean = true;

// Map UI operator symbols to Rust enum names exposed by Wasm
const RustOperation = {
    '+': Operation.Add,
    '-': Operation.Subtract,
    '*': Operation.Multiply,
    '/': Operation.Divide,
};

function updateDisplay(value: string): void {
    display.textContent = value;
}

function clear(): void {
    currentInput = '0';
    previousValue = null;
    operation = null;
    waitingForSecondOperand = true;
    updateDisplay(currentInput);
}

// Function to handle number and decimal inputs
function handleNumber(value: string): void {
    if (waitingForSecondOperand || currentInput === '0') {
        currentInput = value === '.' ? '0.' : value;
        waitingForSecondOperand = false;
    } else if (value === '.' && !currentInput.includes('.')) {
        currentInput += value;
    } else if (value !== '.') {
        currentInput += value;
    }
    updateDisplay(currentInput);
}

// Function to handle operator selection (+, -, *, /)
function handleOperator(op: keyof typeof RustOperation): void {
    const inputValue: number = parseFloat(currentInput);

    if (previousValue === null) {
        previousValue = inputValue;
        operation = op;
        waitingForSecondOperand = true;
        currentInput = '0';
        updateDisplay(inputValue.toString());
        return;
    }

    if (operation && !waitingForSecondOperand) {
        // Rust Wasm function call
        const result: number = calculate(
            previousValue, 
            inputValue, 
            RustOperation[operation] // Type-safe mapping to the Wasm enum
        );

        previousValue = result;
        operation = op;
        waitingForSecondOperand = true;
        currentInput = '0';
        
        updateDisplay(result.toString());
    } else if (previousValue !== null && op) {
        // If we press a new operator without a second number, just switch the operator
        operation = op;
        updateDisplay(previousValue.toString());
    }
}

// Function to handle the equals button
function handleEquals(): void {
    if (previousValue === null || waitingForSecondOperand || operation === null) return;

    const inputValue: number = parseFloat(currentInput);

    // Rust Wasm function call
    const result: number = calculate(
        previousValue, 
        inputValue, 
        RustOperation[operation] // Type-safe mapping
    );

    // Reset state for next calculation
    currentInput = result.toString();
    previousValue = null;
    operation = null;
    waitingForSecondOperand = true;
    
    updateDisplay(currentInput);
}

function handleDelete(): void {
    if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
    } else {
        currentInput = '0';
    }
    waitingForSecondOperand = false;
    updateDisplay(currentInput);
}

// --- Initialization ---
function setupEventListeners(): void {
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const type: string = button.getAttribute('data-type') || '';
            const value: string | null = button.getAttribute('data-value');
            const op: keyof typeof RustOperation | null = button.getAttribute('data-op') as keyof typeof RustOperation | null;

            switch (type) {
                case 'number':
                    if (value) handleNumber(value);
                    break;
                case 'operator':
                    if (op) handleOperator(op);
                    break;
                case 'equals':
                    handleEquals();
                    break;
                case 'clear':
                    clear();
                    break;
                case 'delete':
                    handleDelete();
                    break;
            }
        });
    });
}

// 1. Initialize Wasm
init('./wasm-calculator/pkg/wasm_calculator_bg.wasm').then(() => {
    // 2. Set up front-end state and events
    setupEventListeners();
    updateDisplay('0');
}).catch(e => {
    console.error("Failed to load Wasm module:", e);
    display.textContent = "Wasm Load Error";
});