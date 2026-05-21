// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('aximoz_token')?.value || '';

  // Definição de escopo de proteção de rotas (Strict Access Control)
  const isStrictlyPrivate = path.startsWith('/configuracoes');

  // Interceptação de acesso não autorizado: Redirecionamento para o fluxo de autenticação
  if (isStrictlyPrivate && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Tratamento de estado de sessão ativa (Prevenção de re-login)
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Liberação de tráfego para rotas públicas (Pass-through)
  return NextResponse.next();
}

// Configuração de interceptação na arquitetura Edge (Edge Execution Matcher)
export const config = {
  matcher: [
    '/configuracoes/:path*',
    '/login',
  ],
};