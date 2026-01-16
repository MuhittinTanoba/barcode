const COMMON_PRINTER_NAME = process.env.PRINTER_NAME || "80mm Series Printer";

const mainPrinterConfig = {
    type: 'EPSON',
    printerName: COMMON_PRINTER_NAME,
    width: 40, // 80mm standard
    characterSet: 'PC857_TURKISH',
};

export const printerConfig = {
    // Single printer setup - both roles use the same printer
    kitchen: mainPrinterConfig,
    cashier: mainPrinterConfig
};
