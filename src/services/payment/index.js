/**
 * Payment Service - Ana Export Dosyası
 */

export { default as paymentProcessor, PaymentProcessor } from './PaymentProcessor.js';
export { default as PaymentConfig } from './config.js';
export { BaseStrategy } from './strategies/BaseStrategy.js';
export { SaleStrategy } from './strategies/SaleStrategy.js';

// Legacy uyumluluk için PaymentService alias
import paymentProcessor from './PaymentProcessor.js';
export const PaymentService = {
    processTransaction: (tranCode, extraData) => paymentProcessor.process(tranCode, extraData)
};
