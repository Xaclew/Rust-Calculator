use wasm_bindgen::prelude::*;

// Define the operations enum. We use #[wasm_bindgen] to expose this to TypeScript.
#[wasm_bindgen]
#[derive(Debug, Clone, Copy)]
pub enum Operation {
    Add,
    Subtract,
    Multiply,
    Divide,
}

// Main calculation function exposed to JavaScript
#[wasm_bindgen]
pub fn calculate(a: f64, b: f64, operation: Operation) -> f64 {
    match operation {
        Operation::Add => a + b,
        Operation::Subtract => a - b,
        Operation::Multiply => a * b,
        Operation::Divide => {
            // Basic error handling: prevent division by zero
            if b == 0.0 {
                // In a real application, you'd return a Result<f64, String> or panic.
                // For simplicity here, we return 0.0, but log the error.
                web_sys::console::error_1(&"Error: Division by zero!".into());
                0.0
            } else {
                a / b
            }
        }
    }
}

// Helper function to initialize logging in the browser console
#[wasm_bindgen(start)]
pub fn run() {
    web_sys::console::log_1(&"Rust Wasm Calculator Initialized.".into());
}