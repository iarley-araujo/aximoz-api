// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import * as cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    // Validação de autorização do serviço de agendamento (CRON)
    const authHeader = request.headers.get('Authorization');
    const tokenSecreto = `Bearer ${process.env.CRON_SECRET}`;

    if (!authHeader || authHeader !== tokenSecreto) {
      return NextResponse.json({ erro: "Acesso estritamente negado." }, { status: 401 });
    }

    const hoje = new Date();
    const diaDoMesAtual = hoje.getDate(); 

    // Extrai a lista de ativos únicos presentes nas carteiras
    const ativosNaCarteira = await prisma.carteiras.findMany({
      select: { ticker: true },
      distinct: ['ticker'],
    });

    if (ativosNaCarteira.length === 0) {
      return NextResponse.json({ sucesso: true, mensagem: "Nenhum ativo nas carteiras para verificar." });
    }

    const pagamentosDeHoje = [];

    // Engine de Web Scraping para captura de proventos
    for (const ativo of ativosNaCarteira) {
      const ticker = ativo.ticker.toLowerCase();
      
      try {
        // Spoofing de User-Agent para contornar bloqueios WAF/Anti-Bot
        const response = await fetch(`https://investidor10.com.br/fiis/${ticker}/`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          // Parse de indicadores via seletores CSS do DOM
          const valorRendimentoTexto = $('.indicators .desc .value').first().text().trim();
          const dataPagamentoTexto = $('td:contains("Data de Pagamento")').next('td').text().trim();

          // Sanitização de dados financeiros e datas
          const valorLimpo = parseFloat(valorRendimentoTexto.replace('R$', '').replace(',', '.').trim());
          const diaPagamentoExtraido = parseInt(dataPagamentoTexto.split('/')[0]);

          if (!isNaN(valorLimpo) && !isNaN(diaPagamentoExtraido) && diaPagamentoExtraido === diaDoMesAtual) {
            pagamentosDeHoje.push({
              ticker: ativo.ticker,
              valorPorCota: valorLimpo,
              diaPagamento: diaPagamentoExtraido
            });
          }
        }
      } catch (error) {
        console.warn(`[SCRAPER_WARN] Falha ao capturar dados do ticker ${ticker}, ignorando...`);
      }
      
      // Prevenção contra Rate Limiting (Delay de 1s)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (pagamentosDeHoje.length === 0) {
      return NextResponse.json({ sucesso: true, mensagem: `Raspagem concluída. Nenhum dividendo agendado para o dia ${diaDoMesAtual}.` });
    }

    let notificacoesGeradas = 0;

    // Disparo em lote de notificações para investidores elegíveis
    for (const pagamento of pagamentosDeHoje) {
      const investidores = await prisma.carteiras.findMany({
        where: {
          ticker: pagamento.ticker,
          quantidade: { gt: 0 }
        }
      });

      for (const investidor of investidores) {
        const totalRecebido = (investidor.quantidade * pagamento.valorPorCota).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        await prisma.notificacoes.create({
          data: {
            usuario_id: investidor.usuario_id,
            titulo: `💸 Dividendos do ${pagamento.ticker} caíram!`,
            mensagem: `Dia de alegria! Suas ${investidor.quantidade} cotas de ${pagamento.ticker} renderam um total de ${totalRecebido} em proventos hoje. O dinheiro já foi provisionado na sua carteira inteligente.`,
            lida: false
          }
        });

        notificacoesGeradas++;
      }
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `Varredura e raspagem concluídas. ${notificacoesGeradas} notificações de dividendos disparadas!`
    });

  } catch (error) {
    console.error("[CRON_DIVIDENDOS_ERROR] Falha na rotina:", error);
    return NextResponse.json({ erro: "Falha ao processar rotina de agendamento." }, { status: 500 });
  }
}