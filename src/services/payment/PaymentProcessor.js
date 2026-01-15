/**
 * PaymentProcessor - Merkezi Ödeme İşlemcisi
 * 
 * Yeni işlem türü eklemek için:
 * 1. strategies/ klasöründe yeni strateji oluşturun
 * 2. registerStrategy() ile bu dosyaya kaydedin
 */

import SaleStrategy from './strategies/SaleStrategy.js';
import ParamDownloadStrategy from './strategies/ParamDownloadStrategy.js';
import VoidStrategy from './strategies/VoidStrategy.js';
import ReturnStrategy from './strategies/ReturnStrategy.js';

import PreAuthStrategy from './strategies/PreAuthStrategy.js';
import PreAuthCaptureStrategy from './strategies/PreAuthCaptureStrategy.js';
import ReturnByRecordNoStrategy from './strategies/ReturnByRecordNoStrategy.js';
import PreAuthByRecordNoStrategy from './strategies/PreAuthByRecordNoStrategy.js';
import BatchStrategy from './strategies/BatchStrategy.js';

class PaymentProcessor {
    constructor() {
        this.strategies = new Map();
        this.registerDefaultStrategies();
    }

    /**
     * Varsayılan stratejileri kaydeder
     */
    registerDefaultStrategies() {
        this.registerStrategy(SaleStrategy);
        this.registerStrategy(ParamDownloadStrategy);
        this.registerStrategy(VoidStrategy);
        this.registerStrategy(ReturnStrategy);
        this.registerStrategy(PreAuthStrategy);
        this.registerStrategy(PreAuthCaptureStrategy);
        this.registerStrategy(ReturnByRecordNoStrategy);
        this.registerStrategy(PreAuthByRecordNoStrategy);
        this.registerStrategy(BatchStrategy);
    }

    /**
     * Yeni bir strateji kaydeder
     * @param {class} StrategyClass - BaseStrategy'den türemiş sınıf
     */
    registerStrategy(StrategyClass) {
        const tranCodes = StrategyClass.supportedTranCodes || [];
        tranCodes.forEach(code => {
            this.strategies.set(code, StrategyClass);
        });
    }

    /**
     * Desteklenen tüm işlem kodlarını döner
     */
    getSupportedTranCodes() {
        return Array.from(this.strategies.keys());
    }

    /**
     * İşlem kodunun desteklenip desteklenmediğini kontrol eder
     */
    isSupported(tranCode) {
        return this.strategies.has(tranCode);
    }

    /**
     * Ödeme işlemini gerçekleştirir
     */
    async process(tranCode, params = {}) {
        if (!tranCode) {
            return { success: false, error: 'Transaction code (tranCode) is required' };
        }

        const StrategyClass = this.strategies.get(tranCode);
        if (!StrategyClass) {
            return {
                success: false,
                error: `Unsupported transaction code: ${tranCode}`,
                supportedCodes: this.getSupportedTranCodes()
            };
        }

        const strategy = new StrategyClass();
        return strategy.execute(tranCode, params);
    }
}

// Singleton instance
const paymentProcessor = new PaymentProcessor();

export { PaymentProcessor, paymentProcessor };
export default paymentProcessor;
