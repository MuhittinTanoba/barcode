import { printer as ThermalPrinter, types as PrinterTypes } from "node-thermal-printer";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { printerConfig } from '../app/config/printers';

class PrinterManager {
  constructor() {
    this.tempDir = path.join(process.cwd(), '.temp_print_jobs');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Generic helper to send buffer to printer via PowerShell (Direct Spooler)
  async _printRaw(buffer, printerName) {
    return new Promise((resolve, reject) => {
      const tempFilePath = path.join(this.tempDir, `print_job_${Date.now()}.bin`);
      const scriptPath = path.join(process.cwd(), 'src', 'services', 'print_spooler.ps1');

      try {
        fs.writeFileSync(tempFilePath, buffer);
      } catch (err) {
        console.error('Failed to write temp print file:', err);
        return resolve(false);
      }

      // Execute the PowerShell script that uses C# RawPrinterHelper
      // We wrap arguments in quotes to handle spaces in printer name or paths
      const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${printerName}" "${tempFilePath}"`;

      exec(command, (error, stdout, stderr) => {
        // Cleanup temp file
        try {
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        } catch (cleanupErr) {
          console.warn('Failed to cleanup temp print file:', cleanupErr);
        }

        if (error) {
          console.error(`Printer Error (${printerName}):`, error.message, stderr);
          return resolve(false);
        }

        // Check if our script output "Success"
        if (stdout && stdout.includes('Success')) {
          console.log(`Print success: ${printerName}`);
          resolve(true);
        } else {
          console.error(`Printer Script Failed (${printerName}):`, stdout, stderr);
          resolve(false);
        }
      });
    });
  }

  // Mutfak Fişi Yazdır
  async printKitchenReceipt(orderData) {
    const config = printerConfig.kitchen;

    try {
      let printer = new ThermalPrinter({
        type: PrinterTypes[config.type] || PrinterTypes.STAR,
        interface: 'buffer',
        characterSet: config.characterSet || 'PC857_TURKISH',
        width: config.width || 42
      });

      printer.alignCenter();
      printer.bold(true);
      //printer.setTextSize(1, 1);
      printer.println('KITCHEN ORDER');
      //printer.setTextSize(0, 0);
      printer.println(`Table: ${orderData.tableId?.number || 'To-Go'}`);
      const orderId = orderData._id ? orderData._id.toString() : '????';
      printer.println(`Order #: ${orderId.slice(-4)}`);
      printer.println(`Date: ${new Date().toLocaleString()}`);
      printer.println('--------------------------------');
      printer.alignLeft();

      orderData.items.forEach(item => {
        printer.println(`[ ] ${item.quantity}x ${item.name || item.title}`);

        if (item.options && item.options.length > 0) {
          printer.bold(false);
          item.options.forEach(option => {
            printer.println(`    + ${option.name}`);
          });
          printer.bold(true);
        }

        if (item.description) {
          printer.invert(true);
          printer.println(`    NOTE: ${item.description}`);
          printer.invert(false);
          printer.bold(true);
        }
        printer.newLine();
      });

      printer.println('--------------------------------');
      printer.newLine();
      printer.newLine();
      printer.newLine();
      printer.cut();

      const buffer = printer.getBuffer();
      return await this._printRaw(buffer, config.printerName);

    } catch (err) {
      console.error('Kitchen print generation error:', err);
      return false;
    }
  }

  // Kasa Fişi Yazdır (Ödeme sonrası)
  async printCashierReceipt(orderData) {
    const config = printerConfig.cashier;

    try {
      let printer = new ThermalPrinter({
        type: PrinterTypes[config.type] || PrinterTypes.STAR,
        interface: 'buffer',
        characterSet: config.characterSet || 'PC857_TURKISH',
        width: config.width || 42
      });

      // Initialize/Reset Printer commands (ESC @) to clear any previous weird state
      printer.raw(Buffer.from([0x1B, 0x40]));

      printer.alignCenter();
      printer.bold(true);
      //printer.setTextSize(1, 1);
      printer.println('BOSS POS');
      //printer.setTextSize(0, 0);
      printer.println('Restaurant Receipt');
      printer.println('================================');
      printer.alignLeft();
      printer.bold(false);
      const orderId = orderData._id ? orderData._id.toString() : '??????';
      printer.println(`Order: ${orderId.slice(-6)}`);
      printer.println(`Table: ${orderData.tableId?.number || 'To-Go'}`);
      printer.println(`Date: ${new Date().toLocaleString()}`);
      printer.println('================================');

      if (orderData.items) {
        // Manual formatting to avoid excessive ESC commands (align switching)
        orderData.items.forEach(item => {
          const itemTotal = (item.unitPrice * item.quantity) +
            (item.options ? item.options.reduce((sum, opt) => sum + (opt.price || 0), 0) * item.quantity : 0);

          const itemTotalStr = `$${itemTotal.toFixed(2)}`;
          const itemQtyName = `${item.quantity}x ${item.name || item.title}`;

          const maxChars = config.width || 42;
          const spaceNeeded = maxChars - itemTotalStr.length - 1;

          if (spaceNeeded > itemQtyName.length) {
            const spaces = ' '.repeat(spaceNeeded - itemQtyName.length);
            printer.println(`${itemQtyName}${spaces}${itemTotalStr}`);
          } else {
            printer.println(itemQtyName);
            // Manual right align for price on next line
            const pricePadding = Math.max(0, maxChars - itemTotalStr.length);
            printer.println(' '.repeat(pricePadding) + itemTotalStr);
          }

          if (item.options && item.options.length > 0) {
            item.options.forEach(option => {
              printer.println(`  + ${option.name} ($${option.price})`);
            });
          }
        });
      }

      printer.println('================================');

      // Manual TOTAL alignment to avoid ESC commands
      const totalStr = `TOTAL: $${(orderData.totalAmount || 0).toFixed(2)}`;
      const totalPadding = Math.max(0, (config.width || 42) - totalStr.length);
      printer.println(' '.repeat(totalPadding) + totalStr);

      if (orderData.paymentMethod) {
        // Manual align right for payment method too
        const paymentStr = `Paid via: ${orderData.paymentMethod.toUpperCase()}`;
        const paymentPadding = Math.max(0, (config.width || 42) - paymentStr.length);
        printer.println(' '.repeat(paymentPadding) + paymentStr);
      }

      printer.alignCenter();
      printer.println('================================');
      printer.println('Thank you for visiting!');

      for(let i=0; i<5; i++) {
          printer.newLine();
      }
      const buffer = printer.getBuffer();
      printer.cut();
      return await this._printRaw(buffer, config.printerName);

    } catch (err) {
      console.error('Cashier print generation error:', err);
      return false;
    }
  }

  // Test Print
  async testPrint() {
    console.log('🧪 Test Print requested');
    const config = printerConfig.cashier;

    try {
      let printer = new ThermalPrinter({
        type: PrinterTypes[config.type] || PrinterTypes.STAR,
        interface: 'buffer',
        characterSet: config.characterSet || 'PC857_TURKISH',
        width: config.width || 42
      });

      printer.alignCenter();
      printer.bold(true);
      printer.println('TEST PRINT');
      printer.println('----------------');
      printer.println('System Connection OK');
      printer.println(new Date().toLocaleString());
      printer.println('----------------');

      printer.cut();

      const buffer = printer.getBuffer();
      return await this._printRaw(buffer, config.printerName);
    } catch (e) {
      console.error('Test print failed:', e);
      return false;
    }
  }
}

// Singleton instance
const printerManager = new PrinterManager();
export default printerManager;
