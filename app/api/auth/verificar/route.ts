import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  try {
    // 1. Extração de Parâmetros da URL
    // Exemplo de URL esperada: /api/auth/verificar?email=mateus...&codigo=123456
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const codigo = searchParams.get('codigo');

    // Validação básica
    if (!email || !codigo) {
      return NextResponse.json({ erro: "E-mail e código são obrigatórios na URL." }, { status: 400 });
    }

    // 2. Busca o utilizador na base de dados
    const user = await prisma.usuarios.findFirst({
      where: { email: email }
    });

    if (!user) {
      return NextResponse.json({ erro: "Usuário não encontrado." }, { status: 404 });
    }

    // 3. Proteção: A conta já estava verificada antes?
    if (user.conta_verificada) {
      return NextResponse.json({ 
        sucesso: true, 
        mensagem: "Esta conta já foi verificada anteriormente!" 
      }, { status: 200 });
    }

    // 4. Validação do Código Criptográfico
    if (user.codigo_verificacao !== codigo) {
      return NextResponse.json({ erro: "Código inválido ou expirado." }, { status: 401 });
    }

    // 5. Ativação Definitiva (Atualiza a base de dados)
    await prisma.usuarios.update({
      where: { id: user.id }, // O Prisma exige a chave primária para atualizar
      data: {
        conta_verificada: true,  // Altera de false (0) para true (1)
        codigo_verificacao: null // Apaga o código para que não possa ser usado de novo (MUITO IMPORTANTE!)
      }
    });

    // 6. Resposta de Sucesso
    // Em um sistema real com Frontend, você poderia até fazer um redirecionamento 
    // direto para a tela de login usando: NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.json({
      sucesso: true,
      mensagem: "Conta ativada com sucesso! O seu acesso está liberado."
    });

  } catch (error) {
    console.error("Erro interno na Verificação:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar a verificação." }, 
      { status: 500 }
    );
  }
}