import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import crypto from 'crypto'; // Biblioteca nativa do Node para criptografia e aleatoriedade

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ erro: "O e-mail é obrigatório." }, { status: 400 });
    }

    // 1. Busca o usuário no banco
    const user = await prisma.usuarios.findFirst({
      where: { email: email }
    });

    // 2. PROTEÇÃO CONTRA USER ENUMERATION
    // Se o usuário não existir, fingimos que deu certo para confundir os atacantes.
    if (!user) {
      return NextResponse.json({
        sucesso: true,
        mensagem: "Se o e-mail estiver cadastrado, um código de recuperação será enviado."
      });
    }

    // 3. Gera um código de 6 dígitos seguro e aleatório
    const codigoRecuperacao = crypto.randomInt(100000, 999999).toString();

    // 4. Salva o código na coluna 'codigo_verificacao' do usuário
    await prisma.usuarios.update({
      where: { id: user.id }, // O Prisma exige o ID (chave primária) para fazer o update
      data: { codigo_verificacao: codigoRecuperacao }
    });

    // 5. SIMULAÇÃO DE ENVIO DE E-MAIL
    // Como ainda não ligamos um serviço de e-mail (como AWS SES ou Resend), 
    // vamos "imprimir" o e-mail no terminal para podermos testar.
    console.log(`\n=========================================`);
    console.log(`📧 E-MAIL ENVIADO PELA AXIMOZ 📧`);
    console.log(`Para: ${user.email}`);
    console.log(`Assunto: Recuperação de Senha`);
    console.log(`Seu código de verificação é: ${codigoRecuperacao}`);
    console.log(`=========================================\n`);

    return NextResponse.json({
      sucesso: true,
      mensagem: "Se o e-mail estiver cadastrado, um código de recuperação será enviado."
    });

  } catch (error) {
    console.error("Erro interno na Recuperação:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar a solicitação." }, 
      { status: 500 }
    );
  }
}