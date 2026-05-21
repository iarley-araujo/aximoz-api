// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verificarTokenJWT } from '../../../../lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Validação de sessão estrita via HttpOnly Cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('aximoz_token')?.value;

    if (!token) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    const payload = await verificarTokenJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ erro: "Sessão expirada ou inválida." }, { status: 401 });
    }

    const usuarioId = Number(payload.id);

    // Recuperação paginada de notificações (limite tático de 20 registros para otimização de I/O)
    const listaNotificacoes = await prisma.notificacoes.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { data_criacao: 'desc' },
      take: 20 
    });

    // Agregação de métricas: Contagem de alertas não lidos (Badge indicator)
    const naoLidasCount = await prisma.notificacoes.count({
      where: {
        usuario_id: usuarioId,
        lida: false
      }
    });

    return NextResponse.json({
      sucesso: true,
      nao_lidas: naoLidasCount,
      alertas: listaNotificacoes
    }, { status: 200 });

  } catch (error) {
    console.error("[API_NOTIFICATIONS_GET] Falha no processamento:", error);
    return NextResponse.json(
      { erro: "Falha ao carregar métricas e fila de notificações." }, 
      { status: 500 }
    );
  }
}