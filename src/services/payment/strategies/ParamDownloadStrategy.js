/**
 * ParamDownloadStrategy - Parametre Yükleme İşlemi
 * Cihazın güncel parametreleri ve güvenlik bilgilerini (Keys) indirmesini sağlar.
 * Genellikle cihaz ilk kurulduğunda veya belirli aralıklarla yapılması gerekir.
 */

import { BaseStrategy } from './BaseStrategy.js';

export class ParamDownloadStrategy extends BaseStrategy {
    static supportedTranCodes = ['EMVParamDownload'];
    transactionType = 'admin';

    /**
     * Parametre doğrulama
     * ParamDownload için özel bir parametre gerekmez, sadece standart alanlar yeterlidir.
     */
    validateParams(params) {
        return { valid: true };
    }

    /**
     * İsteği oluşturur
     * BaseStrategy'nin standart yapısı yeterlidir, ekstra veri eklemeye gerek yok.
     */
    async buildRequest(tranCode, params = {}) {
        return super.buildRequest(tranCode, params);
    }
}

export default ParamDownloadStrategy;
