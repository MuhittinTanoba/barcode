import { BaseStrategy } from './BaseStrategy.js';

export class ReturnByRecordNoStrategy extends BaseStrategy {
    static supportedTranCodes = ['ReturnByRecordNo'];
    transactionType = 'transaction';

    /**
     * Parametreleri doğrular
     */
    validateParams(params) {
        if (!params.Amount || isNaN(parseFloat(params.Amount)) || parseFloat(params.Amount) <= 0) {
            return { valid: false, error: 'Amount is required and must be greater than 0' };
        }
        if (!params.RecordNo) {
            return { valid: false, error: 'RecordNo is required' };
        }
        return { valid: true };
    }

    /**
     * İstek oluşturur
     */
    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        data.TranType = 'Credit';
        data.PartialAuth = 'Allow';

        if (params.RecordNo) data.RecordNo = params.RecordNo;
        if (params.RefNo) data.RefNo = params.RefNo;
        if (params.InvoiceNo) data.InvoiceNo = params.InvoiceNo;
        if (params.AuthCode) data.AuthCode = params.AuthCode; // Opsiyonel olabilir ama genellikle sale dönüşünde varsa eklenir

        // Amount Objesi
        data.Amount = {
            Purchase: parseFloat(params.Amount).toFixed(2)
        };

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);

        return { xml, sequenceNo };
    }
}

export default ReturnByRecordNoStrategy;
