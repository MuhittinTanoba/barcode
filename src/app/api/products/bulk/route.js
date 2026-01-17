import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to read products
const getProducts = () => {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    const fileParams = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileParams);
};

export async function PUT(request) {
    try {
        const { action, value, type } = await request.json(); // action: 'increase' | 'decrease', value: number, type: 'percentage' | 'fixed'

        let products = getProducts();
        const numValue = parseFloat(value);

        if (isNaN(numValue) || numValue < 0) {
            return NextResponse.json({ message: 'Invalid value' }, { status: 400 });
        }

        products = products.map(product => {
            let val = product.deger;

            // Safeguard if deger is missing or null
            if (val === undefined || val === null) {
                val = "0";
            }

            // Convert to string safely
            const strVal = String(val);

            // Parse current price
            // Handle 1.000,00 format or 1000.00 format or just number
            let currentPrice = 0;

            if (typeof val === 'number') {
                currentPrice = val;
            } else {
                // Clean string: remove dots (thousands separator), replace comma with dot (decimal)
                // This assumes TR format: 1.234,56
                // Check if it looks like TR format
                if (strVal.includes(',')) {
                    currentPrice = parseFloat(strVal.replace(/\./g, '').replace(',', '.'));
                } else {
                    // If no comma, maybe it's just plain number logic (15 or 15.5)
                    currentPrice = parseFloat(strVal);
                }
            }

            if (isNaN(currentPrice)) currentPrice = 0;

            let newPrice = currentPrice;

            if (type === 'percentage') {
                const change = currentPrice * (numValue / 100);
                if (action === 'increase') newPrice += change;
                else newPrice -= change;
            } else {
                if (action === 'increase') newPrice += numValue;
                else newPrice -= numValue;
            }

            if (newPrice < 0) newPrice = 0;

            // Return to TR format string for consistency with existing data
            const formattedPrice = newPrice.toFixed(2).replace('.', ',');

            return {
                ...product,
                deger: formattedPrice
            };
        });

        const filePath = path.join(process.cwd(), 'data', 'products.json');
        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));

        return NextResponse.json({ message: 'Products updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
