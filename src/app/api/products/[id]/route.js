import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import Product from '@/models/Product';

// GET single product
export async function GET(request, context) {
  try {
    const { params } = await context;
    await connectDB();
    const product = await Product.findById(params.id)
      .populate('categoryId', 'name');
    
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update product
export async function PUT(request, context) {
  try {
    const { params } = await context;
    await connectDB();
    const body = await request.json();
    
    const product = await Product.findById(params.id);
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    const updateFields = [
      'name',
      'description',
      'categoryId',
      'price',
      'imageUrl',
      'options',
      'isAvailable'
    ];
    
    updateFields.forEach(field => {
      if (body[field] !== undefined) {
        product[field] = body[field];
      }
    });
    
    const updatedProduct = await product.save();
    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

// DELETE product
export async function DELETE(request, context) {
  try {
    const { params } = await context;
    await connectDB();
    const product = await Product.findById(params.id);
    
    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    
    await product.deleteOne();
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
