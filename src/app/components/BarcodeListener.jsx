'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

const BarcodeListener = ({ onNotFound }) => {
    const { addToCart } = useCart();
    const [barcode, setBarcode] = useState('');
    // const [products, setProducts] = useState([]); // Removed
    // No need to fetch all products

    const [modalOpen, setModalOpen] = useState(false);
    const [pendingProduct, setPendingProduct] = useState(null);
    const [newPrice, setNewPrice] = useState('');

    useEffect(() => {
        let timeout;

        const handleKeyDown = async (e) => {
            // If the user is typing in an input field, ignore (unless it's the specific modal input essentially)
            // But we'll handle the modal input blocking via the modal overlay blocking normal interaction,
            // however global listener might still fire if not careful. 
            // We check if modal is open.
            if (modalOpen) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                if (barcode) {
                    try {
                        const response = await fetch(`/api/products?barcode=${barcode}`);
                        const data = await response.json();
                        const foundProducts = Array.isArray(data) ? data : (data.products || []);
                        const productData = foundProducts.find(p => p.barkod === barcode) || foundProducts[0];

                        if (productData) {
                            // Check if price is 0 or missing
                            const price = productData.deger ? parseFloat(productData.deger.toString().replace(',', '.')) : 0;
                            
                            if (price === 0) {
                                setPendingProduct(productData);
                                setNewPrice('');
                                setModalOpen(true);
                            } else {
                                const mappedProduct = {
                                    _id: `${productData.barkod}-${productData.urun_adi}`,
                                    barcode: productData.barkod,
                                    title: productData.urun_adi,
                                    price: price,
                                    description: '',
                                };
                                addToCart(mappedProduct);
                                console.log('Product found:', mappedProduct.title);
                            }
                        } else {
                            console.log('Product not found for barcode:', barcode);
                            if (onNotFound) {
                                onNotFound(barcode);
                            }
                        }
                    } catch (err) {
                        console.error("Error looking up barcode:", err);
                    }
                    setBarcode('');
                }
            } else if (e.key.length === 1) {
                setBarcode(prev => prev + e.key);
                clearTimeout(timeout);
                timeout = setTimeout(() => setBarcode(''), 200); 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeout);
        };
    }, [barcode, addToCart, modalOpen, onNotFound]);

    const handlePriceUpdate = async (e) => {
        e.preventDefault();
        if (!pendingProduct || !newPrice) return;

        try {
             // 1. Update backend
             await fetch('/api/products', {
                 method: 'PUT',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ ...pendingProduct, deger: newPrice })
             });

             // 2. Add to cart with new price
             const mappedProduct = {
                _id: `${pendingProduct.barkod}-${pendingProduct.urun_adi}`,
                barcode: pendingProduct.barkod,
                title: pendingProduct.urun_adi,
                price: parseFloat(newPrice.replace(',', '.')),
                description: '',
            };
            addToCart(mappedProduct);
            
            // 3. Close modal
            setModalOpen(false);
            setPendingProduct(null);
            setNewPrice('');
        } catch (err) {
            console.error("Failed to update price", err);
            alert("Fiyat güncellenirken hata oluştu.");
        }
    };

    if (modalOpen) {
        return (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                     <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900">Fiyat Belirle</h3>
                        <p className="text-sm text-gray-500 mt-1">{pendingProduct?.urun_adi}</p>
                    </div>
                    <form onSubmit={handlePriceUpdate} className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Fiyatı</label>
                             <input 
                                type="text" // using text to allow comma if needed, usually handled by parseFloat
                                autoFocus
                                required
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full text-2xl font-bold p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => { setModalOpen(false); setPendingProduct(null); }}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                            >
                                İptal
                            </button>
                             <button 
                                type="submit" 
                                className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium shadow-lg transition-all"
                            >
                                Kaydet ve Ekle
                            </button>
                        </div>
                    </form>
                </div>
             </div>
        );
    }

    return null; // Invisible component
};

export default BarcodeListener;
