// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { verificarTokenJWT } from '../../../lib/jwt';

export async function GET(request: NextRequest) {
  // Autenticação via JWT (Headers ou Cookies)
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('aximoz_token')?.value;
  const tokenString = authHeader?.split(' ')[1] || cookieToken;

  if (!tokenString) {
    return NextResponse.json({ erro: "Acesso Negado: Token ausente." }, { status: 401 });
  }

  const payload = await verificarTokenJWT(tokenString);
  if (!payload || !payload.id) {
    return NextResponse.json({ erro: "Acesso Negado: Token inválido ou expirado." }, { status: 401 });
  }

  try {
    // Busca os ativos atrelados exclusivamente ao ID do token (Prevenção IDOR)
    const dadosCarteira = await prisma.carteiras.findMany({
      where: { 
        usuario_id: Number(payload.id) 
      }
    });

    return NextResponse.json({
      sucesso: true,
      total_ativos: dadosCarteira.length,
      dados: dadosCarteira
    }, { status: 200 });

  } catch (error) {
    console.error("[API_CARTEIRA_GET] Erro interno:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao buscar os dados da carteira." },
      { status: 500 }
    );
  }
}