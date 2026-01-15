import http from 'k6/http';
import { check, sleep } from 'k6';

// -----------------------------------------------------------------------
// POS YÜK VE YAŞAM DÖNGÜSÜ TESTİ (FULL LIFECYCLE LOAD TEST)
// -----------------------------------------------------------------------
// Senaryo:
//  1. Kasiyer sisteme girer (Login).
//  2. Sipariş oluşturur (Create Order - To Go).
//  3. Ödeme alır (Add Payment - Cash & Fulfilled).
//  4. Fiş yazdırır (Print Receipt).
//  5. Bir sonraki müşteri için bekler.
//
export const options = {
    scenarios: {
        cashier_full_cycle: {
            executor: 'constant-vus',
            vus: 1,              // Anlık aktif kasiyer sayısı
            duration: '2h',      // Test süresi (2 Saat)
        },
    },
    thresholds: {
        // Toplam işlem süresi yine de kısa olmalı ama yazıcı latency ekleyebilir.
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.01'],
    },
};

const BASE_URL = 'http://localhost:3000';

// -----------------------------------------------------------------------
// 1. SETUP: Oturum aç ve Ürün Bul
// -----------------------------------------------------------------------
export function setup() {
    // 1. Login ol
    const loginPayload = JSON.stringify({
        username: 'cashier1',
        password: '123456'
    });

    const loginHeaders = { 'Content-Type': 'application/json' };
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, { headers: loginHeaders });

    check(loginRes, {
        'Login Başarılı': (r) => r.status === 200,
    });

    if (loginRes.status !== 200) {
        console.error('Login başarısız oldu. Durum:', loginRes.status, loginRes.body);
        return { token: null, productId: null };
    }

    let token = null;
    if (loginRes.cookies && loginRes.cookies.token && loginRes.cookies.token.length > 0) {
        token = loginRes.cookies.token[0].value;
    }

    // 2. Ürünleri Getir (Auth Token ile)
    const params = {
        cookies: {
            token: token
        }
    };

    const prodRes = http.get(`${BASE_URL}/api/products`, params);

    check(prodRes, {
        'Ürünler Getirildi': (r) => r.status === 200,
    });

    let productId = null;
    let productName = 'Test Product';

    try {
        const products = prodRes.json();
        if (products && products.length > 0) {
            productId = products[0]._id;
            productName = products[0].name;
            console.log(`Test için seçilen ürün: ${productName} (${productId})`);
        }
    } catch (e) {
        console.error('Ürün parse hatası:', e);
    }

    return { token, productId, productName };
}

// -----------------------------------------------------------------------
// 2. DEFAULT FUNCTION (Full Cycle)
// -----------------------------------------------------------------------
export default function (data) {
    if (!data.token || !data.productId) {
        console.error('Test verisi eksik (token veya ürün yok).');
        sleep(10);
        return;
    }

    // Ortak Header ve Cookie
    const params = {
        headers: { 'Content-Type': 'application/json' },
        cookies: { token: data.token },
    };

    // -----------------------------------------------------------------------
    // ADIM 1: SİPARİŞ OLUŞTUR (Create Order)
    // -----------------------------------------------------------------------
    const orderPayload = JSON.stringify({
        orderType: 'to_go',
        items: [
            {
                productId: data.productId,
                name: data.productName,
                quantity: 1,
                unitPrice: 100
            }
        ],
        subtotal: 100,
        totalAmount: 100,
        paymentStatus: 'unpaid',
        status: 'pending'
    });

    const createRes = http.post(`${BASE_URL}/api/orders`, orderPayload, params);

    const orderSuccess = check(createRes, {
        'Sipariş Oluşturuldu (201)': (r) => r.status === 201,
    });

    if (!orderSuccess) {
        console.error('Sipariş oluşturulamadı:', createRes.body);
        sleep(5);
        return;
    }

    const orderId = createRes.json('_id');

    // Kasiyer düşünme payı (Sipariş girdikten sonra ödeme ekranına geçiş)
    sleep(1);

    // -----------------------------------------------------------------------
    // ADIM 2: ÖDEME YAP (Pay Order - Cash)
    // -----------------------------------------------------------------------
    // PUT /api/orders/[id] endpoint'ine "addPayment" veya "amountPaid" ile istek atılır.
    // Backend mantığı: addPayment nesnesi gönderilirse split/advanced logic çalışır.
    // Full ödeme için basitçe amountPaid ve paymentStatus set edilebilir ama 
    // en güvenlisi backend'in beklediği "legacy" veya "new" metodunu kullanmaktır.
    // PUT kodunda: if (body.amountPaid !== undefined) bloğu var.

    const paymentPayload = JSON.stringify({
        amountPaid: 100,
        paymentStatus: 'paid', // Siparişi tamamen kapatır
        paymentMethod: 'cash',
        status: 'paid',        // Sipariş durumu
        change: 0
    });

    const payRes = http.put(`${BASE_URL}/api/orders/${orderId}`, paymentPayload, params);

    check(payRes, {
        'Ödeme Alındı (200)': (r) => r.status === 200,
    });

    // Ödeme sonrası fiş yazdırma butonuna basma süresi
    sleep(1);

    // -----------------------------------------------------------------------
    // ADIM 3: FİŞ YAZDIR (Print Receipt)
    // -----------------------------------------------------------------------
    // POST /api/printer/print
    const printPayload = JSON.stringify({
        orderId: orderId
    });

    const printRes = http.post(`${BASE_URL}/api/printer/print`, printPayload, params);

    check(printRes, {
        'Fiş Yazdırıldı (200)': (r) => r.status === 200,
    });

    // -----------------------------------------------------------------------
    // ADIM 4: BEKLEME SÜRESİ (Idle Time)
    // -----------------------------------------------------------------------
    // Sipariş gelme aralığı: 10 Dakika (600 saniye)
    sleep(600);
}
