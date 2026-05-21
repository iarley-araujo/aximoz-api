// lib/services/rateLimit.ts

// Armazenamento em memória para registar IPs e tentativas.
// (Nota de InfoSec: Em sistemas gigantes como Netflix, usamos um banco Redis para isto, 
// mas para o nosso MVP, a memória RAM do servidor é perfeita e ultrarrápida).
const rateLimitMap = new Map<string, { count: number; lastAttempt: number }>();

export function verificarRateLimit(ip: string, maxTentativas: number = 5, janelaMinutos: number = 15) {
  const agora = Date.now();
  const tempoJanelaMs = janelaMinutos * 60 * 1000;
  const registo = rateLimitMap.get(ip);

  // 1. Se é a primeira vez que o IP bate à porta, criamos a ficha dele
  if (!registo) {
    rateLimitMap.set(ip, { count: 1, lastAttempt: agora });
    return { sucesso: true };
  }

  // 2. Se já passou o tempo de castigo (15 min), limpamos a ficha e deixamos tentar de novo
  if (agora - registo.lastAttempt > tempoJanelaMs) {
    rateLimitMap.set(ip, { count: 1, lastAttempt: agora });
    return { sucesso: true };
  }

  // 3. Se estourou o limite de tentativas dentro do tempo, BLOQUEIA!
  if (registo.count >= maxTentativas) {
    const minutosRestantes = Math.ceil((tempoJanelaMs - (agora - registo.lastAttempt)) / 60000);
    return { sucesso: false, minutosRestantes };
  }

  // 4. Se ainda não estourou o limite, adiciona +1 tentativa à ficha do IP
  registo.count += 1;
  registo.lastAttempt = agora;
  return { sucesso: true };
}