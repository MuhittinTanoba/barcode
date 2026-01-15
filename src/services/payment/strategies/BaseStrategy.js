/**
 * BaseStrategy - Tüm ödeme stratejilerinin ata sınıfı
 * 
 * Yeni bir işlem türü eklemek için:
 * 1. Bu sınıfı extend edin
 * 2. supportedTranCodes dizisini tanımlayın
 * 3. execute() metodunu override edin
 * 4. PaymentProcessor'a stratejinizi kaydedin
 */

import axios from 'axios';
import PaymentConfig from '../config.js';
import { buildTStreamXML } from '../xmlBuilder.js';
import { parseResponse, extractCommonFields, isSuccessStatus } from '../xmlParser.js';
import CardTransaction from '../../../models/CardTransaction.js';

export class BaseStrategy {
    /**
     * Bu strateji tarafından desteklenen işlem kodları
     * Alt sınıflar tarafından override edilmeli
     */
    static supportedTranCodes = [];

    /**
     * İşlem tipi: 'admin' veya 'transaction'
     * Admin: BatchSummary, BatchClose, ParamDownload
     * Transaction: Sale, Void, Return vb.
     */
    transactionType = 'transaction';

    /**
     * Son sequence numarasını veritabanından alır
     */
    async getLastSequenceNo() {
        try {
            const lastTransaction = await CardTransaction.findOne().sort({ createdAt: -1 });
            if (!lastTransaction?.responseXML) {
                return PaymentConfig.defaultSequenceNo;
            }

            const { rStream } = parseResponse(lastTransaction.responseXML);
            return rStream.SequenceNo || PaymentConfig.defaultSequenceNo;
        } catch (error) {
            console.error('Error fetching last sequence number:', error);
            return PaymentConfig.defaultSequenceNo;
        }
    }

    /**
     * Temel istek verisini oluşturur
     * @param {string} tranCode - İşlem kodu
     * @param {object} extraData - Ek veriler
     * @returns {object} İstek verisi
     */
    async buildBaseRequestData(tranCode, extraData = {}) {
        const sequenceNo = await this.getLastSequenceNo();

        const data = {
            'MerchantID': PaymentConfig.merchantId,
            'POSPackageID': PaymentConfig.posPackageId,
            'TranCode': tranCode,
            'SecureDevice': PaymentConfig.secureDevice,
            'SequenceNo': sequenceNo,
            'TranDeviceID': PaymentConfig.deviceId,
            ...extraData
        };

        return { data, sequenceNo };
    }

    /**
     * XML isteği oluşturur
     * @param {string} tranCode - İşlem kodu
     * @param {object} extraData - Ek veriler
     * @returns {object} { xml, sequenceNo }
     */
    async buildRequest(tranCode, extraData = {}) {
        const { data, sequenceNo } = await this.buildBaseRequestData(tranCode, extraData);

        const rootTag = this.transactionType === 'admin' ? 'Admin' : 'Transaction';
        const xml = buildTStreamXML(rootTag, data);

        return { xml, sequenceNo };
    }

    /**
     * Datacap API'ye istek gönderir
     * @param {string} xml - İstek XML'i
     * @returns {Promise<object>} API yanıtı
     */
    async sendRequest(xml) {
        const response = await axios.post(PaymentConfig.apiUrl, xml, {
            headers: {
                'Content-Type': 'text/xml',
                'Authorization': PaymentConfig.authHeader
            }
        });
        return response.data;
    }

    /**
     * İşlemi veritabanına kaydeder
     * @param {object} logData - Kayıt verileri
     * @returns {Promise<object>} Kayıt objesi
     */
    async createTransactionLog(logData) {
        return await CardTransaction.create({
            status: 'Pending',
            ...logData
        });
    }

    /**
     * İşlem kaydını günceller
     * @param {object} log - Mevcut kayıt
     * @param {object} updateData - Güncellenecek veriler
     */
    async updateTransactionLog(log, updateData) {
        Object.assign(log, updateData);
        await log.save();
    }

    /**
     * Parametreleri doğrular
     * Alt sınıflar tarafından override edilebilir
     * @param {object} params - İşlem parametreleri
     * @returns {{ valid: boolean, error?: string }}
     */
    validateParams(params) {
        return { valid: true };
    }

    /**
     * Ana işlem metodu
     * Alt sınıflar tarafından override edilmeli
     * @param {string} tranCode - İşlem kodu
     * @param {object} params - İşlem parametreleri
     * @returns {Promise<object>} İşlem sonucu
     */
    async execute(tranCode, params = {}) {
        // Parametre doğrulama
        const validation = this.validateParams(params, tranCode);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        let transactionLog;

        try {
            // XML oluştur
            const { xml, sequenceNo } = await this.buildRequest(tranCode, params);

            // Log oluştur
            transactionLog = await this.createTransactionLog({
                tranCode,
                tranType: this.getTranType(tranCode),
                requestXML: xml,
                sequenceNo,
                merchantID: PaymentConfig.merchantId,
                amount: (!isNaN(parseFloat(params.Amount))) ? parseFloat(params.Amount) * 100 : null, // Cent'e çevir
                orderId: params.orderId || null
            });

            // API isteği
            const responseXML = await this.sendRequest(xml);
            const { rStream } = parseResponse(responseXML);
            const commonFields = extractCommonFields(rStream);
            const isSuccess = isSuccessStatus(commonFields.cmdStatus);

            // Log güncelle
            await this.updateTransactionLog(transactionLog, {
                responseXML,
                status: isSuccess ? 'Success' : 'Error',
                textResponse: commonFields.textResponse,
                dsixReturnCode: commonFields.dsixReturnCode,
                batchNo: commonFields.batchNo,
                authCode: commonFields.authCode,
                cardType: commonFields.cardType,
                cardLast4: commonFields.acctNo ? commonFields.acctNo.slice(-4) : null,
                parsedResponse: rStream
            });

            return {
                success: isSuccess,
                data: rStream,
                transactionId: transactionLog._id,
                message: commonFields.textResponse
            };

        } catch (error) {
            console.error(`[${tranCode}] Error:`, error.message);

            if (transactionLog) {
                await this.updateTransactionLog(transactionLog, {
                    status: 'Error',
                    textResponse: error.message
                });
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * TranCode'dan işlem tipini belirler
     * @param {string} tranCode 
     * @returns {string} İşlem tipi
     */
    getTranType(tranCode) {
        const typeMap = {
            'EMVSale': 'sale',
            'ContactlessEMVSale': 'sale',
            'VoidSale': 'void',
            'VoidReturn': 'void',
            'Return': 'return',
            'EMVReturn': 'return',
            'PreAuth': 'preauth',
            'PreAuthCapture': 'capture',
            'BatchSummary': 'batch',
            'BatchClose': 'batch',
            'EMVParamDownload': 'admin'
        };
        return typeMap[tranCode] || 'other';
    }
}

export default BaseStrategy;
