const http = require('http');

// Ayarlar
const TARGET_URL = process.argv[2] || 'http://localhost:3000/api/health';
const TOTAL_REQUESTS = parseInt(process.argv[3]) || 1000;
const CONCURRENCY = parseInt(process.argv[4]) || 50;

console.log(`🚀 Stress Test Başlatılıyor...`);
console.log(`🎯 Hedef: ${TARGET_URL}`);
console.log(`📊 Toplam İstek: ${TOTAL_REQUESTS}`);
console.log(`⚡ Eşzamanlılık (Concurrency): ${CONCURRENCY}`);

let completed = 0;
let success = 0;
let fail = 0;
let startTime = Date.now();
let latencies = [];

function makeRequest() {
    return new Promise((resolve) => {
        const reqStartTime = Date.now();

        // Node.js'in http modülünü kullanarak istek yapıyoruz (bağımlılık gerektirmemesi için)
        // Eğer https ise https modülü gerekir, ancak dev ortamı genelde http'dir.
        const lib = TARGET_URL.startsWith('https') ? require('https') : require('http');

        const req = lib.get(TARGET_URL, (res) => {
            // Veriyi tüketmek önemli, yoksa bağlantı açık kalabilir
            res.resume();

            const reqEndTime = Date.now();
            latencies.push(reqEndTime - reqStartTime);

            if (res.statusCode >= 200 && res.statusCode < 300) {
                success++;
            } else {
                fail++;
                // console.log(`Hata Kodu: ${res.statusCode}`);
            }
            completed++;
            resolve();
        });

        req.on('error', (e) => {
            fail++;
            console.error(`İstek hatası: ${e.message}`);
            completed++;
            resolve();
        });
    });
}

async function start() {
    const queue = [];

    // İlk parti istekleri gönder
    for (let i = 0; i < Math.min(CONCURRENCY, TOTAL_REQUESTS); i++) {
        queue.push(worker());
    }

    await Promise.all(queue);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    printResults(duration);
}

async function worker() {
    while (completed < TOTAL_REQUESTS) {
        // completed kontrolü loop içinde de yapılmalı ama concurrency nedeniyle 
        // burada basitçe recursive veya loop ile devam edebiliriz.
        // Basit bir yaklaşım: worker bir istek yapar, bitince yenisini dener.
        // Ancak toplam istek sayısına ulaşıldıysa durur.

        // Dikkat: `completed` artmadan önce kontrol ediyoruz ama 
        // async doğası gereği biraz fazla istek gidebilir. Basit test için sorun değil.
        if (completed + success + fail >= TOTAL_REQUESTS) break;

        await makeRequest();
    }
}

// Worker mantığını biraz daha düzgün kuralım
async function startWorkerPool() {
    const workers = [];
    // Toplam yapılacak iş miktarı kadar loop dönmek yerine
    // CONCURRENCY kadar worker başlatırız, her biri iş bitene kadar istek atar.

    /* 
       Burada basit bir mantık kuruyoruz:
       Global bir sayaç (sentRequests) tutalım. 
       Her worker, sentRequests < TOTAL_REQUESTS olduğu sürece istek atsın.
    */
}

let sentRequests = 0;

async function runWorker() {
    while (sentRequests < TOTAL_REQUESTS) {
        sentRequests++;
        await makeRequest();
    }
}

async function run() {
    console.log('Test çalışıyor, lütfen bekleyin...');

    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(runWorker());
    }

    await Promise.all(workers);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    printResults(duration);
}

function printResults(duration) {
    const avgLatency = latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 0;
    const requestsPerSecond = (TOTAL_REQUESTS / duration).toFixed(2);

    console.log('\n===========================================');
    console.log('📊 SONUÇLAR');
    console.log('===========================================');
    console.log(`⏱️  Toplam Süre:       ${duration.toFixed(2)} saniye`);
    console.log(`✅ Başarılı İstek:     ${success}`);
    console.log(`❌ Başarısız İstek:    ${fail}`);
    console.log(`📈 Saniye Başına İstek:${requestsPerSecond} req/s`);
    console.log(`🐢 Ortalama Gecikme:   ${avgLatency} ms`);
    console.log('===========================================\n');
}

run();
