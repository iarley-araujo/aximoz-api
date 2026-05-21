// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { verificarTokenJWT } from '../../../../lib/jwt';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    // Validação de sessão estrita via HttpOnly Cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('aximoz_token')?.value;

    if (!token) {
      return NextResponse.json({ erro: "Acesso Negado: Não autenticado." }, { status: 401 });
    }

    // Decodificação JWT e extração de identidade (Prevenção IDOR)
    const payload = await verificarTokenJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ erro: "Token inválido ou expirado." }, { status: 401 });
    }

    const usuarioId = Number(payload.id);
    const body = await request.json();
    const { nome, foto_perfil, senha_atual, nova_senha } = body;

    // Recuperação do estado atual do usuário
    const user = await prisma.usuarios.findUnique({ where: { id: usuarioId } });
    if (!user) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }

    // Construção dinâmica do payload de atualização (Partial Update)
    const dadosParaAtualizar: any = {};

    if (nome) dadosParaAtualizar.nome = nome;
    if (foto_perfil) dadosParaAtualizar.foto_perfil = foto_perfil;

    // Fluxo de alteração de credenciais com validação estrita
    if (nova_senha) {
      if (!senha_atual) {
        return NextResponse.json({ erro: "Para trocar a senha, a senha atual é obrigatória." }, { status: 400 });
      }

      // Validação criptográfica da senha atual (Prevenção contra Account Takeover)
      const senhaAntigaCorreta = await bcrypt.compare(senha_atual, user.senha_hash || "");
      if (!senhaAntigaCorreta) {
        return NextResponse.json({ erro: "A senha atual está incorreta." }, { status: 401 });
      }

      if (nova_senha.length < 6) {
        return NextResponse.json({ erro: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
      }

      // Geração de hash saltado para a nova credencial
      dadosParaAtualizar.senha_hash = await bcrypt.hash(nova_senha, 10);
    }

    // Persistência das alterações
    await prisma.usuarios.update({
      where: { id: usuarioId },
      data: dadosParaAtualizar
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Perfil atualizado com sucesso!"
    }, { status: 200 });

  } catch (error) {
    console.error("[API_PROFILE_PATCH] Erro de processamento:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao atualizar o perfil." }, 
      { status: 500 }
    );
  }
}