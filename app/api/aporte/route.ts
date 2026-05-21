import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { verificarTokenJWT } from '../../../lib/jwt';
import { aporteSchema } from '../../../lib/schemas/aporteSchema';

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validação de entrada estrita (Zod)
    const validacao = aporteSchema.safeParse(body);

    if (!validacao.success) {
      const mensagemErro = validacao.error.issues[0].message;
      return NextResponse.json({ sucesso: false, erro: mensagemErro }, { status: 400 });
    }

    const dadosLimpos = validacao.data;

    // Persistência no banco de dados
    const novoAporte = await prisma.carteiras.create({
      data: {
        ticker: dadosLimpos.codigo_ativo,
        quantidade: dadosLimpos.quantidade,
        preco_medio: dadosLimpos.valor_aporte,
        tipo: "FII", // TODO: Receber tipo dinamicamente do client
        preco_atual: dadosLimpos.valor_aporte,
        dy_anual: 0,
        usuario_id: Number(payload.id) // Prevenção contra IDOR
      }
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: `Aporte de ${dadosLimpos.codigo_ativo} registrado com sucesso!`,
      dados: novoAporte
    }, { status: 201 });

  } catch (error) {
    console.error("[API_APORTE_POST] Erro interno:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar a requisição." },
      { status: 500 }
    );
  }
}