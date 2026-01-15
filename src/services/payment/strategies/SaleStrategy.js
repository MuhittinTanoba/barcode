/**
 * SaleStrategy - Satış İşlemleri
 * Desteklenen işlemler: EMVSale
 */

import { BaseStrategy } from './BaseStrategy.js';
import { buildAmountObject } from '../xmlBuilder.js';

export class SaleStrategy extends BaseStrategy {
    static supportedTranCodes = ['EMVSale'];
    transactionType = 'transaction';

    /**
     * Satış parametrelerini doğrular
     */
    validateParams(params) {
        const amountValue = typeof params.Amount === 'object' ? params.Amount?.Purchase : params.Amount;
        const amount = parseFloat(amountValue);

        if (!amountValue || isNaN(amount) || amount <= 0) {
            return { valid: false, error: 'Amount is required and must be greater than 0' };
        }
        return { valid: true };
    }

    /**
     * Satış isteği oluşturur
     */
    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        // Amount objesini düzenle
        if (params.Amount && typeof params.Amount !== 'object') {
            data.Amount = buildAmountObject(parseFloat(params.Amount), parseFloat(params.Tip || 0));
        }

        // InvoiceNo ekle (varsa)
        if (params.InvoiceNo) {
            data.InvoiceNo = params.InvoiceNo;
        }

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);
        return { xml, sequenceNo };
    }
}

export default SaleStrategy;
