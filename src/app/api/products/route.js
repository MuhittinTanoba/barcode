import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to read products
const getProducts = () => {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  const fileParams = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileParams);
};

export async function GET() {
  try {
    const products = getProducts();
    // Simulate the structure the frontend expects, or adapt frontend.
    // The previous mongo schema had _id, name, price etc.
    // The new JSON has urun_kodu, urun_adi, barkod, deger.
    // We should map it to a standard format if we want to keep frontend changes minimal,
    // OR just return as is and update frontend.
    // Let's assume we return as is and update frontend.
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  // Optional: Implement adding products to JSON file
  try {
    const body = await request.json();
    const products = getProducts();
    products.push(body);
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const products = getProducts();
    const index = products.findIndex(p => p.barkod === body.barkod);

    if (index > -1) {
      products[index] = { ...products[index], ...body };
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
      return NextResponse.json(products[index]);
    }
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const barkod = searchParams.get('barkod');

    if (!barkod) {
      return NextResponse.json({ message: 'Barcode required' }, { status: 400 });
    }

    let products = getProducts();
    const initialLength = products.length;
    products = products.filter(p => p.barkod !== barkod);

    if (products.length !== initialLength) {
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
      return NextResponse.json({ message: 'Deleted' });
    }

    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
