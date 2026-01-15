/**
 * XML Builder Helper
 * Datacap API için XML oluşturma yardımcıları
 */

import { XMLBuilder } from 'fast-xml-parser';

const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    parseTagValue: true
});

/**
 * TStream XML oluşturur
 * @param {string} rootTag - 'Admin' veya 'Transaction'
 * @param {object} data - İşlem verileri
 * @returns {string} XML string
 */
export function buildTStreamXML(rootTag, data) {
    const structure = {
        'TStream': {
            [rootTag]: data
        }
    };
    return builder.build(structure);
}

/**
 * Amount objesini oluşturur
 * @param {number} purchase - Satış tutarı
 * @param {number} [tip] - Bahşiş tutarı (opsiyonel)
 * @returns {object} Amount objesi
 */
export function buildAmountObject(purchase, tip = 0) {
    const amount = { Purchase: purchase.toFixed(2) };
    return amount;
}

export default { buildTStreamXML, buildAmountObject };
