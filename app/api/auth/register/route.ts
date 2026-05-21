import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, senha } = body;

    // 1. Validação Básica de Segurança
    if (!nome || !email || !senha) {
      return NextResponse.json({ erro: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ erro: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
    }

    // 2. Prevenção de Duplicidade (O e-mail já existe?)
    const usuarioExistente = await prisma.usuarios.findFirst({
      where: { email: email }
    });

    if (usuarioExistente) {
      return NextResponse.json({ erro: "Este e-mail já está em uso na Aximoz." }, { status: 409 }); // 409 significa Conflito
    }

    // 3. O Cofre Forte: Gerando o Hash da Senha
    // O número 10 é o "Salt Rounds" (custo de processamento). É o padrão ouro do mercado.
    const senhaHash = await bcrypt.hash(senha, 10);

    // 4. Salvando no Banco de Dados (Hostinger)
    // Usamos os nomes exatos que vimos na sua estrutura do phpMyAdmin
    const novoUsuario = await prisma.usuarios.create({
      data: {
        nome: nome,
        email: email,
        senha_hash: senhaHash,
        
        // Configurações padrão para contas novas (preparando o terreno pro SaaS)
        // Configurações padrão para contas novas (preparando o terreno pro SaaS)
        plano: "Free",
        elo_atual: "Iniciante",
        perfil_publico: false, // <-- Alterado de 0 para false
        conta_verificada: false, // <-- Alterado de 0 para false
        
        // Nota: O Prisma pode exigir um boolean (false) ou int (0) para o tinyint, 
        // caso dê linha vermelha no 0, mude para false.
      }
    });

    // 5. Retorno de Sucesso (Nunca devolvemos a senha_hash para o front-end!)
    return NextResponse.json({
      sucesso: true,
      mensagem: "Conta criada com sucesso! Bem-vindo à revolução financeira.",
      usuario: {
        id: novoUsuario.id,
        nome: novoUsuario.nome,
        email: novoUsuario.email
      }
    }, { status: 201 }); // 201 significa "Criado"

  } catch (error) {
    console.error("Erro interno no Cadastro:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao processar o cadastro." }, 
      { status: 500 }
    );
  }
}