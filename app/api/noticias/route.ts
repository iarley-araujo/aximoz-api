// ==========================================
// ㉿ ikaro - Gate of Babylon (Indexer)
// ==========================================

import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'enclosure'],
  }
});

export async function GET(request: Request) {
  try {
    // Fonte RSS externa de mercado financeiro
    const feedUrl = 'https://www.infomoney.com.br/mercados/feed/'; 
    const feed = await parser.parseURL(feedUrl);

    // Whitelist de palavras-chave para filtragem de contexto
    const palavrasChave = [
      'ação', 'ações', 'fii', 'fiis', 'dividendo', 'dividendos', 'provento',
      'dólar', 'dolar', 'euro', 'real', 'câmbio',
      'cdb', 'cdi', 'selic', 'ipca', 'tesouro direto', 'renda fixa',
      'b3', 'ibovespa', 'bovespa', 'mercado', 'investimento', 'fundo'
    ];

    // Pipeline de filtragem de conteúdo
    const noticiasFiltradas = feed.items.filter((item) => {
      const textoBusca = `${item.title} ${item.contentSnippet}`.toLowerCase();
      return palavrasChave.some(palavra => textoBusca.includes(palavra));
    });

    // Parse e sanitização do payload de saída (Limitado aos 10 itens mais recentes)
    const noticias = noticiasFiltradas.slice(0, 10).map((item) => {
      let imagemUrl = null;
      
      if (item['media:content']) {
        imagemUrl = item['media:content']['$']?.url;
      } else if (item.enclosure) {
        imagemUrl = item.enclosure.url;
      }

      // Regex para sanitização de tags HTML residuais no snippet
      const resumoLimpo = item.contentSnippet ? item.contentSnippet.replace(/(<([^>]+)>)/gi, "") : "";

      return {
        titulo: item.title,
        link: item.link,
        data_publicacao: item.pubDate,
        resumo: resumoLimpo,
        imagem: imagemUrl
      };
    });

    return NextResponse.json({
      sucesso: true,
      fonte: "InfoMoney (Filtrado Exclusivo)",
      total_resultados: noticias.length,
      noticias: noticias
    }, { status: 200 });

  } catch (error) {
    console.error("[API_NOTICIAS_GET] Falha na extração RSS:", error);
    return NextResponse.json(
      { sucesso: false, erro: "Falha ao extrair as notícias do servidor externo." }, 
      { status: 500 }
    );
  }
}