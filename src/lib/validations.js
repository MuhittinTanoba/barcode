import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
});

export const employeeSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    position: z.string().optional(),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'manager', 'staff', 'kitchen']).default('staff'),
    isActive: z.boolean().default(true),
});

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    categoryId: z.string().min(1, 'Category is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    imageUrl: z.string().optional(),
    options: z.array(z.any()).optional(),
    isAvailable: z.boolean().default(true),
});
