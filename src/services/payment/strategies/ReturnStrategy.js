import { BaseStrategy } from './BaseStrategy.js';
import { buildAmountObject } from '../xmlBuilder.js';

export class ReturnStrategy extends BaseStrategy {
    static supportedTranCodes = ['EMVReturn'];
    transactionType = 'transaction';

    validateParams(params) {
        if (!params.Amount || isNaN(parseFloat(params.Amount)) || parseFloat(params.Amount) <= 0) {
            return { valid: false, error: 'Amount is required and must be greater than 0' };
        }
        return { valid: true };
    }

    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        // Amount
        if (params.Amount) {
            data.Amount = buildAmountObject(parseFloat(params.Amount));
        }

        // Optional Reference Fields
        if (params.InvoiceNo) data.InvoiceNo = params.InvoiceNo;
        if (params.RefNo) data.RefNo = params.RefNo;
        if (params.RecordNo) data.RecordNo = params.RecordNo;

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);

        return { xml, sequenceNo };
    }
}

export default ReturnStrategy;
