import { NextResponse } from 'next/server';
import printerManager from '@/services/printer';

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderData, type } = body;

        if (!orderData) {
            return NextResponse.json(
                { success: false, error: 'No order data provided' },
                { status: 400 }
            );
        }

        let result = false;

        if (type === 'kitchen') {
            result = await printerManager.printKitchenReceipt(orderData);
        } else {
            // Default to cashier/customer receipt
            result = await printerManager.printCashierReceipt(orderData);
        }

        if (result) {
            return NextResponse.json({ success: true, message: 'Print job sent successfully' });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to send print job' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Print API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
