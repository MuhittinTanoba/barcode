# 📋 **Müşteri Bilgileri API Dokümantasyonu**

## 🔗 **Base URL**
```
https://boss-pos.vercel.app/
```

---

## 📖 **API Endpoint'leri**

### **1. Müşteri Listesi**
```http
GET /api/customers
```

**Query Parameters:**
- `search` (string): İsim veya telefon ile arama
- `page` (number): Sayfa numarası (varsayılan: 1)
- `limit` (number): Sayfa başına kayıt (varsayılan: 20)
- `tier` (string): Müşteri seviyesi (bronze, silver, gold, platinum)

**Örnek İstek:**
```bash
GET /api/customers?search=ahmet&page=1&limit=10&tier=gold
```

**Örnek Yanıt:**
```json
{
  "customers": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "phone": "05551234567",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@example.com",
      "birthday": "1990-05-15T00:00:00.000Z",
      "address": "İstanbul, Türkiye",
      "points": 150,
      "totalSpent": 2500.50,
      "visitCount": 12,
      "tier": "silver",
      "registeredAt": "2024-01-15T10:30:00.000Z",
      "lastVisit": "2024-03-20T14:45:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-03-20T14:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### **2. Yeni Müşteri Oluşturma**
```http
POST /api/customers
```

**Request Body:**
```json
{
  "phone": "05551234567",
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "birthday": "1990-05-15",
  "address": "İstanbul, Türkiye",
  "isQuickRegistration": false
}
```

**Zorunlu Alanlar:**
- `phone` (string): Telefon numarası
- `name` (string): Müşteri adı

**Opsiyonel Alanlar:**
- `email` (string): E-posta adresi
- `birthday` (string): Doğum tarihi (YYYY-MM-DD formatında)
- `address` (string): Adres bilgisi
- `isQuickRegistration` (boolean): Hızlı kayıt mı (varsayılan: false)

**Örnek Yanıt:**
```json
{
  "message": "Customer created successfully",
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "phone": "05551234567",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "birthday": "1990-05-15T00:00:00.000Z",
    "address": "İstanbul, Türkiye",
    "points": 0,
    "totalSpent": 0,
    "visitCount": 0,
    "tier": "bronze",
    "registeredAt": "2024-03-20T15:30:00.000Z",
    "createdAt": "2024-03-20T15:30:00.000Z",
    "updatedAt": "2024-03-20T15:30:00.000Z"
  }
}
```

---

### **3. Müşteri Detayları**
```http
GET /api/customers/{id}
```

**Örnek İstek:**
```bash
GET /api/customers/64f8a1b2c3d4e5f6a7b8c9d0
```

**Örnek Yanıt:**
```json
{
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "phone": "05551234567",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "birthday": "1990-05-15T00:00:00.000Z",
    "address": "İstanbul, Türkiye",
    "points": 150,
    "totalSpent": 2500.50,
    "visitCount": 12,
    "tier": "silver",
    "registeredAt": "2024-01-15T10:30:00.000Z",
    "lastVisit": "2024-03-20T14:45:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-03-20T14:45:00.000Z"
  }
}
```

---

### **4. Telefon ile Müşteri Arama**
```http
GET /api/customers/phone/{phone}
```

**Örnek İstek:**
```bash
GET /api/customers/phone/05551234567
```

**Örnek Yanıt:**
```json
{
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "phone": "05551234567",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com",
    "points": 150,
    "tier": "silver"
  }
}
```

---

### **5. Müşteri Güncelleme**
```http
PUT /api/customers/{id}
```

**Request Body:**
```json
{
  "name": "Ahmet Yılmaz Güncellendi",
  "email": "ahmet.yeni@example.com",
  "birthday": "1990-05-15",
  "address": "Ankara, Türkiye",
  "phone": "05559876543"
}
```

**Örnek Yanıt:**
```json
{
  "message": "Customer updated successfully",
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "phone": "05559876543",
    "name": "Ahmet Yılmaz Güncellendi",
    "email": "ahmet.yeni@example.com",
    "birthday": "1990-05-15T00:00:00.000Z",
    "address": "Ankara, Türkiye",
    "points": 150,
    "totalSpent": 2500.50,
    "visitCount": 12,
    "tier": "silver",
    "updatedAt": "2024-03-20T16:00:00.000Z"
  }
}
```

---

### **6. Müşteri Silme**
```http
DELETE /api/customers/{id}
```

**Örnek Yanıt:**
```json
{
  "message": "Customer deleted successfully"
}
```

---

### **7. Müşteri Puan Geçmişi**
```http
GET /api/customers/{id}/transactions
```

**Query Parameters:**
- `page` (number): Sayfa numarası (varsayılan: 1)
- `limit` (number): Sayfa başına kayıt (varsayılan: 50)

**Örnek İstek:**
```bash
GET /api/customers/64f8a1b2c3d4e5f6a7b8c9d0/transactions?page=1&limit=10
```

**Örnek Yanıt:**
```json
{
  "transactions": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "customerId": "64f8a1b2c3d4e5f6a7b8c9d0",
      "orderId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "totalAmount": 150.50,
        "createdAt": "2024-03-20T14:45:00.000Z"
      },
      "campaignId": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "name": "İlk Alışveriş İndirimi",
        "type": "discount_percentage"
      },
      "type": "earn",
      "points": 15,
      "description": "Sipariş #12345'ten kazanılan puanlar",
      "createdAt": "2024-03-20T14:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### **8. Puan Ekleme**
```http
POST /api/customers/{id}/points/add
```

**Request Body:**
```json
{
  "points": 50,
  "description": "Manuel puan ekleme"
}
```

**Örnek Yanıt:**
```json
{
  "message": "Points updated successfully",
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "points": 200,
    "totalSpent": 2500.50
  },
  "transaction": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "customerId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "type": "earn",
    "points": 50,
    "description": "Manuel puan ekleme",
    "createdAt": "2024-03-20T16:30:00.000Z"
  }
}
```

---

### **9. Puan Kullanma**
```http
POST /api/customers/{id}/points/redeem
```

**Request Body:**
```json
{
  "points": 25,
  "description": "Puan kullanımı"
}
```

**Örnek Yanıt:**
```json
{
  "message": "Points redeemed successfully",
  "customer": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "points": 175
  },
  "transaction": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d5",
    "customerId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "type": "redeem",
    "points": -25,
    "description": "Puan kullanımı",
    "createdAt": "2024-03-20T16:35:00.000Z"
  }
}
```

---

## 🔧 **Hata Kodları**

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı |
| 201 | Oluşturuldu |
| 400 | Geçersiz istek |
| 404 | Bulunamadı |
| 409 | Çakışma (telefon numarası zaten var) |
| 500 | Sunucu hatası |

---

## 📝 **Müşteri Seviyeleri (Tier)**

| Seviye | Minimum Harcama | Açıklama |
|--------|----------------|----------|
| Bronze | 0₺ | Yeni müşteri |
| Silver | 1,001₺ | Gümüş üye |
| Gold | 5,001₺ | Altın üye |
| Platinum | 15,000₺ | Platin üye |

---

## 🚀 **Kullanım Örnekleri**

### **cURL ile Müşteri Oluşturma:**
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "05551234567",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@example.com"
  }'
```

### **JavaScript ile Müşteri Arama:**
```javascript
const response = await fetch('http://localhost:3000/api/customers/phone/05551234567');
const data = await response.json();
console.log(data.customer);
```

### **Python ile Müşteri Listesi:**
```python
import requests

response = requests.get('http://localhost:3000/api/customers?search=ahmet&tier=silver')
data = response.json()
print(data['customers'])
```

---

## 📋 **Notlar**

- Tüm tarih alanları ISO 8601 formatında döner
- Telefon numaraları benzersiz olmalıdır
- Müşteri seviyeleri otomatik olarak hesaplanır
- Puan işlemleri otomatik olarak geçmişe kaydedilir
- Tüm API'ler JSON formatında yanıt döner

Bu API dokümantasyonu ile müşteri bilgileri sistemini tam olarak kullanabilirsiniz! 🎉
