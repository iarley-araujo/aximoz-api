// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verificarTokenJWT } from '../../../../lib/jwt';
import { cookies } from 'next/headers';

export async function DELETE(request: Request) {
  try {
    // Validação de sessão via HttpOnly Cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('aximoz_token')?.value;

    if (!token) {
      return NextResponse.json({ erro: "Acesso Negado: Não autenticado." }, { status: 401 });
    }

    const payload = await verificarTokenJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ erro: "Token inválido ou expirado." }, { status: 401 });
    }

    const usuarioId = Number(payload.id);

    // Exclusão física do usuário (Cascata de deleção gerenciada pelo banco de dados)
    await prisma.usuarios.delete({
      where: { id: usuarioId }
    });

    const response = NextResponse.json({
      sucesso: true,
      mensagem: "Conta encerrada e excluída com sucesso."
    }, { status: 200 });

    // Revogação do token e invalidação estrita de sessão no client-side
    response.cookies.set('aximoz_token', '', { maxAge: -1 });

    return response;

  } catch (error) {
    console.error("[API_ACCOUNT_DELETE] Erro interno de exclusão:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar a exclusão da conta." }, 
      { status: 500 }
    );
  }
}