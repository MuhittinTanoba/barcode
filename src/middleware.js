import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request) {
    // Exclude auth routes and public assets
    if (
        request.nextUrl.pathname.startsWith('/api/auth') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/favicon.ico') ||
        request.nextUrl.pathname.startsWith('/public')
    ) {
        return NextResponse.next();
    }

    // For Market POS migration, we are disabling the strict auth check on /api
    // since we are using a simplified local auth model.
    // In a real production environment, you would want to keep this or adapt verifyJWT.
    /*
    if (request.nextUrl.pathname.startsWith('/api')) {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const payload = await verifyJWT(token);

        if (!payload) {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Add user info to headers for downstream use if needed
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.sub);
        requestHeaders.set('x-user-role', payload.role);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }
    */

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
