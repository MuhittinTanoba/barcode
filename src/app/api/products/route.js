import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to read products
const getProducts = () => {
  const filePath = path.join(process.cwd(), 'data', 'products.json');
  const fileParams = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileParams);
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const barcode = searchParams.get('barcode') || '';

    let products = getProducts();

    // Barcode specific lookup (FAST)
    if (barcode) {
      const product = products.find(p => p.barkod === barcode);
      return NextResponse.json(product ? [product] : []);
    }

    // Filter by category
    if (category && category !== 'all' && category !== 'diger') {
      products = products.filter(p => p.category === category);
    } else if (category === 'diger') {
      // Optional: define what 'diger' means if it's meant to be "others" or just a specific category slug.
      // Assuming it's a category slug based on previous code.
      products = products.filter(p => p.category === category);
    }

    // Filter by search query (name or barcode)
    if (search) {
      const lowerSearch = search.toLowerCase();
      products = products.filter(p =>
        (p.urun_adi && p.urun_adi.toLowerCase().includes(lowerSearch)) ||
        (p.barkod && p.barkod.includes(search))
      );
    }

    // Sort by name (optional but good for UX)
    // products.sort((a, b) => a.urun_adi.localeCompare(b.urun_adi));

    // Pagination
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = products.slice(startIndex, endIndex);

    return NextResponse.json({
      products: paginatedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });

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
