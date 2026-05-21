// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { PrismaClient } from '@prisma/client';

// Padrão Singleton para gerenciar o Connection Pool e evitar conexões fantasmas durante o HMR (Hot Module Replacement)
const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Instanciação com cache global
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Preservação da instância no escopo global restrita a ambientes de desenvolvimento
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;