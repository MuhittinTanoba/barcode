/**
 * Payment Configuration
 * Tüm ödeme entegrasyonu ayarları burada yönetilir.
 * Değerleri .env dosyasından alır.
 */

export const PaymentConfig = {
    // API Ayarları
    apiUrl: process.env.DATACAP_API_URL || 'https://cloud-test.dcap.com/ProcessEMVTransaction/',
    authHeader: process.env.DATACAP_AUTH,

    // İş Yeri Bilgileri
    merchantId: process.env.MERCHANT_ID || 'BOSPHCOLL0GP',
    deviceId: process.env.DEVICE_ID || '2290454696',
    secureDevice: process.env.SECURE_DEVICE || 'EMV_A35_DATACAP_E2E',
    posPackageId: process.env.POS_PACKAGE_ID || 'BosporusSoftware:1.00',

    // Mod Ayarı
    isTestMode: process.env.DATACAP_TEST_MODE !== 'false', // Default true for safety

    // Varsayılan Sequence No
    defaultSequenceNo: '0010010010'
};

export default PaymentConfig;
