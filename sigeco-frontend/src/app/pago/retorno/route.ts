// sigeco-frontend/src/app/pago/retorno/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define tu URL de producción aquí para evitar problemas con el proxy
const FRONTEND_URL = 'https://sigeco.mindshot.cl';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  // Construimos la URL de redirección final usando la variable definida arriba
  const redirectUrl = new URL('/pago/confirmado', FRONTEND_URL);

  if (token) {
    redirectUrl.searchParams.set('token', token);
  }

  return NextResponse.redirect(redirectUrl, 303);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token');

    if (!token) {
      const errorUrl = new URL('/pago/fracaso', FRONTEND_URL);
      errorUrl.searchParams.set('error', 'Token no recibido');
      return NextResponse.redirect(errorUrl, 303);
    }

    const redirectUrl = new URL('/pago/confirmado', FRONTEND_URL);
    redirectUrl.searchParams.set('token', token as string);

    return NextResponse.redirect(redirectUrl, 303);

  } catch (error) {
    const errorUrl = new URL('/pago/fracaso', FRONTEND_URL);
    errorUrl.searchParams.set('error', 'Petición inválida');
    return NextResponse.redirect(errorUrl, 303);
  }
}