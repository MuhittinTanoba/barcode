const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer');

const printer = new ThermalPrinter({
    type: PrinterTypes.STAR,                                  // Printer type: 'star' or 'epson'
    width: 58,                                                // Number of characters in one line
    interface: 'printer:Star MCP31',                       // Printer interface
    characterSet: CharacterSet.PC437_USA,                  // Printer character set
    removeSpecialCharacters: false,                           // Removes special characters - default: false
    lineCharacter: "=",                                       // Set character for lines - default: "-"
    breakLine: BreakLine.WORD,                                // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
});


const isConnected = await printer.isPrinterConnected();
console.log(isConnected);

const execute = await printer.execute();
console.log(execute);


printer.print("Hello World"); 
printer.println("Hello World");

