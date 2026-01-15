import http from 'k6/http';
import { check, sleep } from 'k6';
import { findBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// -----------------------------------------------------------------------
// POS YÜK TESTİ (POS LOAD TEST)
// -----------------------------------------------------------------------
export const options = {
    scenarios: {
        cashier_activity: {
            executor: 'constant-vus',
            vus: 1,              // Anlık aktif kasiyer sayısı
            duration: '10m',     // Test süresi (Uzun süreli test)
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'],
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

    // Cookie'den token'i al (K6 otomatik cookie yönetimi yapabilir ama manuel garanti olsun)
    // Set-Cookie header'ı karmaşık olabilir, basitçe jar'dan alabiliriz veya response'dan.
    // Bu örnekte login başarılıysa sonraki istekler otomatik cookie ile gider AMA
    // setup() ile default() fonksiyonu farklı VU context'inde çalışır.
    // Bu yüzden token'ı string olarak pass etmemiz lazım.

    // Basit çözüm: Login response cookie'sini parse etmek yerine,
    // eğer API token'i body'de dönmüyorsa (dönmüyor), k6 cookie jar kullanırız.
    // Ancak setup()'dan VUs'a cookie aktarımı otomatik olmaz.
    // API header'dan parse edelim.

    // Set-Cookie: token=eyJhbG...; Path=/; ...
    // Basit bir regex ile alalım.
    // Not: response.cookies nesnesini de kullanabiliriz.
    // Ancak k6 setup() çıktısını JSON serialize eder, bu yüzden string token döndürmek en iyisi.

    let token = null;
    // loginRes.cookies['token'] bir array dönebilir.
    if (loginRes.cookies && loginRes.cookies.token && loginRes.cookies.token.length > 0) {
        token = loginRes.cookies.token[0].value;
    }

    // 2. Ürünleri Getir (Auth Token ile)
    // Token'i cookie olarak ekle
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
        } else {
            console.error('Liste boş veya ürün bulunamadı.');
        }
    } catch (e) {
        console.error('Ürün parse hatası:', e);
    }

    return { token, productId, productName };
}

// -----------------------------------------------------------------------
// 2. DEFAULT FUNCTION
// -----------------------------------------------------------------------
export default function (data) {
    if (!data.token) {
        console.error('Token yok, test iptal.');
        sleep(1);
        return;
    }

    if (!data.productId) {
        console.error('Ürün ID yok, test iptal.');
        sleep(1);
        return;
    }

    // Her istekte cookie olarak token'ı gönder
    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
        cookies: {
            token: data.token,
        },
    };

    const payload = JSON.stringify({
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

    const res = http.post(`${BASE_URL}/api/orders`, payload, params);

    check(res, {
        'Sipariş OK (201)': (r) => r.status === 201,
        'Süre < 500ms': (r) => r.timings.duration < 500,
    });

    if (res.status !== 201) {
        console.log(`Hata Detayı (${res.status}): ${res.body}`);
    }

    sleep(Math.random() * 3 + 2);
}
