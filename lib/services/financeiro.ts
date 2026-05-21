/**
 * SERVIÇOS FINANCEIROS - AXIMOZ WALLET
 * Regras de negócio isoladas para cálculos de investimentos.
 */

// 1. CÁLCULO DE PREÇO MÉDIO
export function calcularPrecoMedio(
  quantidadeAtual: number,
  precoMedioAtual: number,
  novaQuantidade: number,
  novoPrecoCompra: number
): number {
  // Se for a primeira compra, o preço médio é o preço da compra atual
  if (quantidadeAtual === 0) return novoPrecoCompra;

  const valorTotalAtual = quantidadeAtual * precoMedioAtual;
  const valorTotalNovo = novaQuantidade * novoPrecoCompra;
  
  // Fórmula padrão do mercado: (Total Investido Antes + Total Investido Agora) / Quantidade Total
  const novoPrecoMedio = (valorTotalAtual + valorTotalNovo) / (quantidadeAtual + novaQuantidade);
  
  // Retorna com apenas 2 casas decimais (ex: 10.45)
  return Number(novoPrecoMedio.toFixed(2));
}

// 2. CÁLCULO DE DIVIDEND YIELD (DY)
export function calcularDividendYield(
  dividendosPagos12Meses: number,
  precoAtualDaCota: number
): number {
  // Proteção contra divisão por zero (se o preço bugar no banco)
  if (precoAtualDaCota <= 0) return 0;

  // Fórmula: (Dividendos / Preço Atual) * 100 para pegar a porcentagem
  const dy = (dividendosPagos12Meses / precoAtualDaCota) * 100;
  
  return Number(dy.toFixed(2));
}

// 3. O MAGIC NUMBER (Efeito Bola de Neve para FIIs)
// Quantas cotas eu preciso ter para que o rendimento mensal compre 1 cota nova sozinha?
export function calcularMagicNumber(
  precoCotaAtual: number,
  rendimentoMedioMensal: number
): number {
  if (rendimentoMedioMensal <= 0) return 0;

  // Fórmula: Preço da Cota / Rendimento Mensal. 
  // Usamos Math.ceil para arredondar sempre para CIMA, pois não dá pra comprar meia cota na B3.
  const cotasNecessarias = Math.ceil(precoCotaAtual / rendimentoMedioMensal);
  
  return cotasNecessarias;
}