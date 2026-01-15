import { BaseStrategy } from './BaseStrategy.js';

export class PreAuthStrategy extends BaseStrategy {
    static supportedTranCodes = ['EMVPreAuth'];
    transactionType = 'transaction';

    /**
     * PreAuth parametrelerini doğrular
     */
    validateParams(params) {
        if (!params.Amount || isNaN(parseFloat(params.Amount)) || parseFloat(params.Amount) <= 0) {
            return { valid: false, error: 'Amount is required and must be greater than 0' };
        }
        return { valid: true };
    }

    /**
     * PreAuth isteği oluşturur
     */
    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        // Sabit Değerler
        data.CardType = 'Credit';
        data.RecordNo = 'RecordNumberRequested';
        data.PartialAuth = 'Allow';

        // Opsiyonel/Dinamik Değerler
        if (params.InvoiceNo) data.InvoiceNo = params.InvoiceNo;
        if (params.RefNo) data.RefNo = params.RefNo;
        if (params.Frequency) data.Frequency = params.Frequency || 'Recurring';

        // TranInfo
        if (params.CustomerCode) {
            data.TranInfo = {
                CustomerCode: params.CustomerCode
            };
        }

        // Amount Objesi
        const purchase = parseFloat(params.Amount);
        const tax = params.Tax ? parseFloat(params.Tax) : 0;

        data.Amount = {
            Purchase: purchase.toFixed(2),
            Authorize: purchase.toFixed(2)
        };

        if (tax > 0) {
            data.Amount.Tax = tax.toFixed(2);
        }

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);

        return { xml, sequenceNo };
    }
}

export default PreAuthStrategy;
