import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getProducts = () => {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  try {
    const fileParams = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileParams);
  } catch (e) {
    return [];
  }
};

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const products = getProducts();
    // Try to find by barkod first as ID
    let product = products.find(p => p.barkod === id);

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const products = getProducts();

    const index = products.findIndex(p => p.barkod === id);
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

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    let products = getProducts();
    const initialLength = products.length;
    products = products.filter(p => p.barkod !== id);

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
