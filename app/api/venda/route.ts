// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '../../../lib/prisma';
import { verificarTokenJWT } from '../../../lib/jwt';
import { z } from 'zod';

// Validação estrita de payload de transação
const vendaSchema = z.object({
  id_ativo: z.number().int("O ID do ativo deve ser um número inteiro."),
  quantidade_venda: z.number().positive("A quantidade a vender deve ser maior que zero.")
});

export async function POST(request: NextRequest) {
  // Autenticação de sessão via JWT
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('aximoz_token')?.value;
  const tokenString = authHeader?.split(' ')[1] || cookieToken;

  if (!tokenString) {
    return NextResponse.json({ erro: "Acesso Negado: Token ausente." }, { status: 401 });
  }

  // Decodificação JWT e extração de identidade
  const payload = await verificarTokenJWT(tokenString);
  if (!payload || !payload.id) {
    return NextResponse.json({ erro: "Token inválido ou expirado." }, { status: 401 });
  }

  const usuarioId = Number(payload.id);

  try {
    const body = await request.json();
    const validacao = vendaSchema.safeParse(body);

    if (!validacao.success) {
      return NextResponse.json({ sucesso: false, erro: validacao.error.issues[0].message }, { status: 400 });
    }

    const { id_ativo, quantidade_venda } = validacao.data;

    // Prevenção de IDOR Estrita: Busca o ativo garantindo que a propriedade pertence ao usuário do Token
    const ativoNaCarteira = await prisma.carteiras.findFirst({
      where: {
        id: id_ativo,
        usuario_id: usuarioId
      }
    });

    // Se não encontrou, ou o ativo não existe, ou pertence a outro investidor
    if (!ativoNaCarteira) {
      return NextResponse.json({ erro: "Ativo não encontrado ou sem permissão de acesso." }, { status: 404 });
    }

    // Validação de saldo em custódia (Short Selling bloqueado)
    if (quantidade_venda > ativoNaCarteira.quantidade) {
      return NextResponse.json({ erro: "Ordem rejeitada: A quantidade de venda excede o saldo em custódia." }, { status: 400 });
    }

    let resultadoVenda;

    // Lógica de liquidação de ativos: Baixa parcial ou Liquidação total
    if (quantidade_venda === ativoNaCarteira.quantidade) {
      // Liquidação total (Remove o registro)
      resultadoVenda = await prisma.carteiras.delete({
        where: { id: id_ativo }
      });
    } else {
      // Baixa parcial (Atualiza o saldo)
      resultadoVenda = await prisma.carteiras.update({
        where: { id: id_ativo },
        data: {
          quantidade: ativoNaCarteira.quantidade - quantidade_venda
        }
      });
    }

    const tipoVenda = quantidade_venda === ativoNaCarteira.quantidade ? "Liquidação total" : "Venda parcial";

    return NextResponse.json({
      sucesso: true,
      mensagem: `${tipoVenda} realizada com sucesso!`,
      dados: resultadoVenda
    }, { status: 200 });

  } catch (error) {
    console.error("[API_VENDA_POST] Erro na transação:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar a ordem de venda." },
      { status: 500 }
    );
  }
}