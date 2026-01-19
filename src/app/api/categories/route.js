import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getFilePath = () => {
    const dir = process.env.USER_DATA_PATH || path.join(process.cwd(), 'data');
    return path.join(dir, 'categories.json');
};

const getCategories = () => {
    try {
        const filePath = getFilePath();
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
        return [];
    } catch (error) {
        console.error("Error reading categories:", error);
        return [];
    }
};

export async function GET() {
    const categories = getCategories();
    return NextResponse.json(categories);
}

export async function POST(request) {
    try {
        const body = await request.json();
        const categories = getCategories();

        // Check if slug already exists
        if (categories.some(c => c.slug === body.slug)) {
            return NextResponse.json({ message: 'Category with this slug already exists' }, { status: 400 });
        }

        categories.push(body);

        categories.push(body);

        fs.writeFileSync(getFilePath(), JSON.stringify(categories, null, 2));

        return NextResponse.json(body, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const categories = getCategories();

        const index = categories.findIndex(c => c.id === body.id);

        if (index > -1) {
            categories[index] = { ...categories[index], ...body };
            fs.writeFileSync(getFilePath(), JSON.stringify(categories, null, 2));
            return NextResponse.json(categories[index]);
        }

        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID required' }, { status: 400 });
        }

        // Prevent deleting critical categories if needed, but for now allow all.
        // Maybe prevent 'all' or 'urun' if they are hardcoded logic dependencies?
        if (id === 'all') {
            return NextResponse.json({ message: 'Cannot delete system category' }, { status: 403 });
        }

        let categories = getCategories();
        const initialLength = categories.length;
        categories = categories.filter(c => c.id !== id);

        if (categories.length !== initialLength) {
            fs.writeFileSync(getFilePath(), JSON.stringify(categories, null, 2));
            return NextResponse.json({ message: 'Deleted' });
        }

        return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
