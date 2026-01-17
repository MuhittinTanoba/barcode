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

  // Mutfak Fişi Yazdır (Artık tek yazıcı olduğu için çok kullanılmayabilir ama çevirelim)
  async printKitchenReceipt(orderData) {
    const config = printerConfig.kitchen;
    const width = config.width || 32;
    const divider = '-'.repeat(width);

    try {
      let printer = new ThermalPrinter({
        type: PrinterTypes[config.type] || PrinterTypes.STAR,
        interface: 'buffer',
        characterSet: config.characterSet || 'PC857_TURKISH',
        width: width
      });

      printer.alignCenter();
      printer.bold(true);
      printer.println('MUTFAK FISI');
      printer.bold(false);
      const orderId = orderData._id ? orderData._id.toString() : '????';
      printer.println(`Siparis No: ${orderId.slice(-4)}`);
      printer.println(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
      printer.println(divider);
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
          printer.println(`    NOT: ${item.description}`);
          printer.invert(false);
          printer.bold(true);
        }
        printer.newLine();
      });

      printer.println(divider);
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
    const width = config.width || 32;
    const divider = '='.repeat(width);
    const thinDivider = '-'.repeat(width);

    try {
      let printer = new ThermalPrinter({
        type: PrinterTypes[config.type] || PrinterTypes.STAR,
        interface: 'buffer',
        characterSet: config.characterSet || 'PC857_TURKISH',
        width: width
      });

      // Initialize/Reset Printer commands
      printer.raw(Buffer.from([0x1B, 0x40]));

      printer.alignCenter();
      printer.bold(true);
      printer.println('BOSS POS');
      printer.println('Satis Fisi');
      printer.println(divider);
      printer.alignLeft();
      printer.bold(false);
      const orderId = orderData._id ? orderData._id.toString() : '??????';
      printer.println(`Siparis: ${orderId.slice(-6)}`);
      printer.println(`Tarih: ${new Date().toLocaleString('tr-TR')}`);
      printer.println(divider);

      if (orderData.items) {
        orderData.items.forEach(item => {
          const itemTotal = (item.unitPrice * item.quantity) +
            (item.options ? item.options.reduce((sum, opt) => sum + (opt.price || 0), 0) * item.quantity : 0);

          const itemTotalStr = `${itemTotal.toFixed(2)}`; // Removed $ for TL if needed, or keep logic. User is in TR context usually TL but symbol usage is up to user. Assuming just number or TL. Let's stick to number for now or add TL suffix if requested. Standard POS usually just number or TL. Let's put TL at end or just number. 
          // Re-reading user request: "türkçe karakterler". Let's assume functionality is same just language changed. Keeping $ might be weird for TR. Let's use 'TL' suffix or prefix.
          // Since I can't confirm currency symbol preference, I'll stick to number formatted with 2 decimals. Or maybe ' TL'.

          const itemValue = itemTotal.toFixed(2) + ' TL';
          const itemQtyName = `${item.quantity}x ${item.name || item.title}`;

          const spaceNeeded = width - itemValue.length - 1;

          if (spaceNeeded > itemQtyName.length) {
            const spaces = ' '.repeat(spaceNeeded - itemQtyName.length);
            printer.println(`${itemQtyName}${spaces}${itemValue}`);
          } else {
            printer.println(itemQtyName);
            // Right align price on next line
            const pricePadding = Math.max(0, width - itemValue.length);
            printer.println(' '.repeat(pricePadding) + itemValue);
          }

          if (item.options && item.options.length > 0) {
            item.options.forEach(option => {
              printer.println(`  + ${option.name} (${option.price} TL)`);
            });
          }
        });
      }

      printer.println(thinDivider);

      // TOTAL alignment
      const totalStr = `TOPLAM: ${orderData.totalAmount ? orderData.totalAmount.toFixed(2) : '0.00'} TL`;
      const totalPadding = Math.max(0, width - totalStr.length);
      printer.println(' '.repeat(totalPadding) + totalStr);

      if (orderData.paymentMethod) {
        const methodMap = { 'cash': 'Nakit', 'card': 'Kredi Karti' };
        const methodTr = methodMap[orderData.paymentMethod] || orderData.paymentMethod.toUpperCase();

        const paymentStr = `Odeme: ${methodTr}`;
        const paymentPadding = Math.max(0, width - paymentStr.length);
        printer.println(' '.repeat(paymentPadding) + paymentStr);
      }

      printer.newLine();
      printer.alignCenter();
      printer.println('Bizi tercih ettiginiz');
      printer.println('icin tesekkurler!');
      printer.println(divider);

      for (let i = 0; i < 4; i++) {
        printer.newLine();
      }
      const buffer = printer.getBuffer();
      // Cut handled by loop or driver usually, but adding cut command is safe
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
