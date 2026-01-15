/**
 * VoidStrategy - İptal İşlemleri
 * Desteklenen işlemler: VoidSaleByRecordNo, VoidReturnByRecordNo
 */

import { BaseStrategy } from './BaseStrategy.js';
import { buildAmountObject } from '../xmlBuilder.js';

export class VoidStrategy extends BaseStrategy {
    static supportedTranCodes = ['VoidSaleByRecordNo', 'VoidReturnByRecordNo'];
    transactionType = 'transaction';

    /**
     * İptal parametrelerini doğrular
     */
    validateParams(params, tranCode) {
        // Amount kontrolü
        const amountValue = typeof params.Amount === 'object' ? params.Amount?.Purchase : params.Amount;
        const amount = parseFloat(amountValue);

        if (!amountValue || isNaN(amount) || amount <= 0) {
            return { valid: false, error: 'Amount is required and must be greater than 0' };
        }

        // RecordNo veya RefNo kontrolü (En az biri olmalı, VoidSaleByRecordNo için RecordNo şart)
        if (!params.RecordNo) {
            return { valid: false, error: 'RecordNo is required for VoidSaleByRecordNo' };
        }

        if (tranCode === 'VoidReturnByRecordNo' && !params.ProcessData) {
            return { valid: false, error: 'ProcessData is required for VoidReturnByRecordNo' };
        }

        return { valid: true };
    }

    /**
     * İptal isteği oluşturur
     */
    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        // Zorunlu alanları ekle
        data.TranType = 'Credit'; // Kredi kartı işlemi

        // Amount objesini düzenle
        if (params.Amount && typeof params.Amount !== 'object') {
            data.Amount = buildAmountObject(parseFloat(params.Amount), 0); // Void işleminde bahşiş iptali ? Genelde toplam tutar
        }

        // Özel alanları ekle
        if (params.RecordNo) data.RecordNo = params.RecordNo;
        if (params.ProcessData) data.ProcessData = params.ProcessData;
        if (params.RefNo) data.RefNo = params.RefNo;
        if (params.AuthCode) data.AuthCode = params.AuthCode;
        if (params.InvoiceNo) data.InvoiceNo = params.InvoiceNo;
        if (params.AcqRefData) data.AcqRefData = params.AcqRefData;

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);

        return { xml, sequenceNo };
    }
}

export default VoidStrategy;
