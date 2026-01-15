'use client';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';

const BarcodeListener = () => {
    const { addToCart } = useCart();
    const [barcode, setBarcode] = useState('');
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // Fetch products for lookup
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();
                if (Array.isArray(data)) {
                     const mappedProducts = data.map(p => ({
                        _id: p.barkod,
                        title: p.urun_adi,
                        price: parseFloat(p.deger.replace(',', '.')),
                        description: p.urun_kodu,
                      }));
                    setProducts(mappedProducts);
                }
            } catch (error) {
                console.error("Failed to fetch products for barcode listener", error);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        let timeout;

        const handleKeyDown = (e) => {
            // If the user is typing in an input field, ignore
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Enter') {
                if (barcode) {
                    const product = products.find(p => p._id === barcode);
                    if (product) {
                        addToCart(product);
                        // Optional: Play a beep sound
                        console.log('Product found:', product.title);
                    } else {
                        console.log('Product not found for barcode:', barcode);
                        // Optional: Show error
                    }
                    setBarcode('');
                }
            } else if (e.key.length === 1) {
                setBarcode(prev => prev + e.key);
                
                // Reset buffer if typing takes too long (human vs scanner)
                // Scanners are fast. 
                clearTimeout(timeout);
                timeout = setTimeout(() => setBarcode(''), 200); 
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeout);
        };
    }, [products, barcode, addToCart]);

    return null; // Invisible component
};

export default BarcodeListener;
