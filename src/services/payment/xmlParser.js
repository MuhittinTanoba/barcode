/**
 * XML Parser Helper
 * Datacap API yanıtlarını parse etme yardımcıları
 */

import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    textNodeName: "_text",
    parseTagValue: false,
    numberParseOptions: {
        leadingZeros: false,
        hex: false,
        skipLike: /.*/
    }
});

/**
 * XML yanıtını parse eder ve RStream objesini döner
 * @param {string} xmlString - Datacap'ten dönen XML
 * @returns {object} { rStream, rawParsed }
 */
export function parseResponse(xmlString) {
    const parsed = parser.parse(xmlString);
    const rStream = parsed?.RStream || {};

    return {
        rStream,
        rawParsed: parsed
    };
}

/**
 * RStream'den temel alanları çıkarır
 * @param {object} rStream - Parse edilmiş RStream objesi
 * @returns {object} Standart alanlar
 */
export function extractCommonFields(rStream) {
    return {
        cmdStatus: rStream.CmdStatus || 'Unknown',
        textResponse: rStream.TextResponse || '',
        dsixReturnCode: rStream.DSIXReturnCode || '',
        sequenceNo: rStream.SequenceNo || '',
        batchNo: rStream.BatchNo || '',
        authCode: rStream.AuthCode || '',
        refNo: rStream.RefNo || '',
        invoiceNo: rStream.InvoiceNo || '',

        // Kart bilgileri
        cardType: rStream.CardType || '',
        acctNo: rStream.AcctNo || '', // Masked card number

        // Tutar bilgileri
        authorize: rStream.Authorize || '',
        purchase: rStream.Purchase || '',
    };
}

/**
 * İşlem başarılı mı kontrol eder
 * @param {string} cmdStatus - CmdStatus değeri
 * @returns {boolean}
 */
export function isSuccessStatus(cmdStatus) {
    return ['Success', 'Approved'].includes(cmdStatus);
}

export default { parseResponse, extractCommonFields, isSuccessStatus };
