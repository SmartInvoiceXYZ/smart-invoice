import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/create' || pathname === '/create/instant') {
    const url = request.nextUrl.clone();
    url.pathname = '/create/escrow';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/create', '/create/instant'],
};
