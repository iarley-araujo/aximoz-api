import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { verificarRateLimit } from '../../../../lib/services/rateLimit'; // <-- Novo Serviço

export async function POST(request: Request) {
  try {
    // --- ESCUDO ANTI FORÇA-BRUTA (RATE LIMITING) ---
    // Pega o IP real do usuário (se vier de um proxy/Hostinger, pega o header 'x-forwarded-for')
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    
    const limitador = verificarRateLimit(ip);
    if (!limitador.sucesso) {
      // Retorna o Status 429: Too Many Requests (Padrão internacional para bloqueio de spam)
      return NextResponse.json(
        { erro: `Muitas tentativas falhadas. O seu IP foi bloqueado por medida de segurança. Tente novamente em ${limitador.minutosRestantes} minutos.` }, 
        { status: 429 }
      );
    }
    // -----------------------------------------------

    const body = await request.json();
    const { email, senha } = body; 

    const user = await prisma.usuarios.findFirst({
      where: { email: email }
    });

    if (!user) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 401 });
    }

    if (!user.senha_hash) {
      return NextResponse.json({ erro: "Por favor, faça login com a sua conta Google." }, { status: 401 });
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);

    if (!senhaCorreta) {
      return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ id: user.id, email: user.email, plano: user.plano || 'Free' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({
      sucesso: true,
      mensagem: "Login realizado com sucesso!",
      token: token
    });

    response.cookies.set('aximoz_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24
    });

    return response;

  } catch (error) {
    console.error("Erro interno no Login:", error);
    return NextResponse.json({ sucesso: false, erro: "Falha ao processar o login." }, { status: 500 });
  }
}