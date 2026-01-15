// Printer Configuration
const COMMON_PRINTER_NAME = process.env.PRINTER_NAME || "sprt";

export const printerConfig = {
    // Mutfak Yazıcısı (Kitchen) -> Same printer
    kitchen: {
        type: 'EPSON',
        printerName: COMMON_PRINTER_NAME,
        width: 40, // 80mm standard usually 48 chars
        characterSet: 'PC857_TURKISH',
    },

    // Kasa Yazıcısı (Cashier) -> Same printer
    cashier: {
        type: 'EPSON',
        printerName: COMMON_PRINTER_NAME,
        width: 40, // 80mm standard
        characterSet: 'PC857_TURKISH',
    }
};
