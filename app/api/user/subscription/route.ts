// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verificarTokenJWT } from '../../../../lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Validação estrita de sessão e proteção anti-IDOR via HttpOnly Cookies
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

    // Extração de metadados de assinatura e faturamento
    const user = await prisma.usuarios.findUnique({
      where: { id: usuarioId },
      select: {
        plano: true,
        assinatura_mp_id: true,
        data_criacao: true
      }
    });

    if (!user) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }

    // Resolução de Feature Flags baseada em tier (Entitlements)
    const isPro = user.plano?.toLowerCase() === 'pro';

    // Payload tático de controle de acesso ao Client-Side
    const respostaSubscription = {
      sucesso: true,
      plano_atual: user.plano || 'Free',
      recursos: {
        exibir_anuncios: !isPro,
        limite_carteiras: isPro ? 'Ilimitado' : 1,
        relatorios_avancados: isPro,
        suporte_prioritario: isPro
      },
      codigo_assinatura: user.assinatura_mp_id 
    };

    return NextResponse.json(respostaSubscription, { status: 200 });

  } catch (error) {
    console.error("[API_SUBSCRIPTION_GET] Falha na verificação de plano:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao buscar dados de faturamento e assinatura." }, 
      { status: 500 }
    );
  }
}