import { BaseStrategy } from './BaseStrategy.js';

export class BatchStrategy extends BaseStrategy {
    static supportedTranCodes = ['BatchSummary', 'BatchClose'];
    transactionType = 'admin'; // XML root is <Admin>

    /**
     * Parametreleri doğrular
     */
    validateParams(params, tranCode) {
        if (tranCode === 'BatchClose') {
            if (!params.BatchItemCount) return { valid: false, error: 'BatchItemCount is required for BatchClose' };
            if (!params.NetBatchTotal) return { valid: false, error: 'NetBatchTotal is required for BatchClose' };
            if (!params.BatchNo) return { valid: false, error: 'BatchNo is required for BatchClose' };
        }
        return { valid: true };
    }

    /**
     * İstek oluşturur
     */
    async buildRequest(tranCode, params = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, params);

        data.TranType = 'Administrative';

        if (tranCode === 'BatchClose') {
            data.BatchItemCount = params.BatchItemCount;
            data.NetBatchTotal = params.NetBatchTotal;
            data.BatchNo = params.BatchNo;
        }

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        // Root element is <Admin> for these transactions as per the image
        const xml = buildTStreamXML('Admin', data);

        return { xml, sequenceNo };
    }
}

export default BatchStrategy;
