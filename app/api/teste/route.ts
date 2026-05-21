// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { verificarTokenJWT } from '../../../lib/jwt';

export async function GET(request: NextRequest) {
  // Verificação de autenticação (Suporte a Bearer Token e HttpOnly Cookies)
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('aximoz_token')?.value;
  const tokenString = authHeader?.split(' ')[1] || cookieToken;

  if (!tokenString) {
    return NextResponse.json({ erro: "Acesso Negado: Token não fornecido." }, { status: 401 });
  }

  const payload = await verificarTokenJWT(tokenString);
  if (!payload || !payload.id) {
    return NextResponse.json({ erro: "Acesso Negado: Assinatura JWT inválida ou expirada." }, { status: 401 });
  }

  try {
    // Health Check e extração segura dos dados do próprio usuário (Prevenção IDOR)
    const usuarioLogado = await prisma.usuarios.findUnique({
      where: { 
        id: Number(payload.id) 
      },
      select: {
        id: true,
        nome: true,
        email: true,
        elo_atual: true,
        plano: true,
        perfil_publico: true,
        data_criacao: true
      }
    });

    if (!usuarioLogado) {
      return NextResponse.json({ erro: "Usuário não encontrado na base de dados." }, { status: 404 });
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: "API Operacional. Conexão segura estabelecida.",
      dados: usuarioLogado
    }, { status: 200 });

  } catch (error) {
    console.error("[API_PROFILE_GET] Falha na conexão de banco de dados:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha de comunicação com o servidor de banco de dados." },
      { status: 500 }
    );
  }
}