// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verificarTokenJWT } from '../../../lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Autenticação de sessão via JWT (Proteção contra scraping não autorizado)
    const cookieStore = await cookies();
    const token = cookieStore.get('aximoz_token')?.value;

    if (!token) {
      return NextResponse.json({ erro: "Acesso Negado: Autenticação requerida." }, { status: 401 });
    }

    const payload = await verificarTokenJWT(token);
    if (!payload) {
      return NextResponse.json({ erro: "Sessão inválida ou expirada." }, { status: 401 });
    }

    // Query parametrizada: Extração exclusiva de perfis públicos (Opt-in de privacidade)
    const ranking = await prisma.usuarios.findMany({
      where: {
        perfil_publico: true
      },
      select: {
        id: true,
        nome: true,
        foto_perfil: true,
        elo_atual: true,
        plano: true,
        
        // TODO: Integrar rentabilidade real via relação com a tabela 'carteiras'
      },
      take: 50 // Limitação de payload para prevenção de memory leak
    });

    // Algoritmo de ordenação in-memory por tier (Elo Rating)
    const pesosElo: Record<string, number> = {
      "Diamante": 5,
      "Ouro": 4,
      "Prata": 3,
      "Bronze": 2,
      "Iniciante": 1
    };

    ranking.sort((a, b) => {
      const pesoA = pesosElo[a.elo_atual || "Iniciante"] || 0;
      const pesoB = pesosElo[b.elo_atual || "Iniciante"] || 0;
      return pesoB - pesoA;
    });

    return NextResponse.json({
      sucesso: true,
      total_investidores_publicos: ranking.length,
      top_50: ranking
    }, { status: 200 });

  } catch (error) {
    console.error("[API_RANKING_GET] Erro interno de processamento:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao gerar o ranking." }, 
      { status: 500 }
    );
  }
}