import { BaseStrategy } from './BaseStrategy.js';

export class PreAuthCaptureStrategy extends BaseStrategy {
    static supportedTranCodes = ['PreAuthCaptureByRecordNo'];
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
        if (!params.RefNo) {
            return { valid: false, error: 'RefNo is required' };
        }
        if (!params.AuthCode) {
            return { valid: false, error: 'AuthCode is required' };
        }
        if (!params.AcqRefData) {
            return { valid: false, error: 'AcqRefData is required' };
        }
        if (!params.ProcessData) {
            return { valid: false, error: 'ProcessData is required' };
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

        // Zorunlu Alanlar
        if (params.RecordNo) data.RecordNo = params.RecordNo;
        if (params.RefNo) data.RefNo = params.RefNo;
        if (params.AuthCode) data.AuthCode = params.AuthCode;
        if (params.AcqRefData) data.AcqRefData = params.AcqRefData;
        if (params.ProcessData) data.ProcessData = params.ProcessData;
        if (params.InvoiceNo) data.InvoiceNo = params.InvoiceNo;

        // Amount Objesi
        const purchase = parseFloat(params.Amount);
        const gratuity = params.Gratuity ? parseFloat(params.Gratuity) : 0;
        const tax = params.Tax ? parseFloat(params.Tax) : 0;

        data.Amount = {
            Purchase: purchase.toFixed(2)
        };

        if (gratuity > 0) {
            data.Amount.Gratuity = gratuity.toFixed(2);
            // Genelde Authorize Capture'da toplam tutar Purchase + Gratuity + Tax olabilir veya yapılandırmaya göre değişir.
            // Ancak örnek resimde Authorize alanı da var ve toplamı gösteriyor.
            // XMLBuilder otomatik Authorize hesaplamıyor, manuel ekleyelim mi?
            // Örnek: Purchase 61.00, Grat 12.20, Auth 73.20. (61 + 12.2 = 73.2). 
            // Tax 4.04 (Auth içinde değil gibi duruyor resimde? Yoksa Purchase'a dahil mi?
            // Resimde: Purchase 61.00, Authorize 73.20, Gratuity 12.20. Tax 4.04.
            // 61 + 12.20 = 73.20. Tax Authorize'a eklenmemiş görünüyor.
            data.Amount.Authorize = (purchase + gratuity).toFixed(2);
        } else {
            data.Amount.Authorize = purchase.toFixed(2);
        }

        if (params.Gratuity) {
            data.Amount.Gratuity = parseFloat(params.Gratuity).toFixed(2);
        }

        if (tax > 0) {
            data.Amount.Tax = tax.toFixed(2);
        }

        const { buildTStreamXML } = await import('../xmlBuilder.js');
        const xml = buildTStreamXML('Transaction', data);

        return { xml, sequenceNo };
    }
}

export default PreAuthCaptureStrategy;
