/**
 * SimulaBacen — Módulo de Glossário e Dicionário Conceitual de Política Monetária
 * Explicações didáticas e rigorosas fundamentadas na legislação brasileira e no livro-texto
 * para estudantes universitários iniciantes em Finanças, Economia e Administração.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GlossaryModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const TERMS = [
    {
      term: 'Conselho Monetário Nacional (CMN)',
      category: 'Governança & Instituições',
      definition: 'Órgão normativo e deliberativo máximo do Sistema Financeiro Nacional. É composto pelo Ministro da Fazenda (presidente), pelo Ministro do Planejamento e Orçamento e pelo Presidente do Banco Central. Entre suas atribuições fundamentais está a fixação da meta contínua de inflação nacional.',
      practicalHint: 'O CMN define o alvo (a meta de 3,00% com banda de 1,50% a 4,50%), enquanto o Banco Central (BCB) executa a política para cumprir essa meta.'
    },
    {
      term: 'Banco Central do Brasil (BCB)',
      category: 'Governança & Instituições',
      definition: 'Autarquia federal autônoma (criada pela Lei nº 4.595/1964 e com autonomia formalizada pela Lei Complementar nº 179/2021). Tem como objetivo fundamental assegurar a estabilidade de preços (poder de compra da moeda Real), além de zelar pela higidez do sistema financeiro e fomentar o pleno emprego.',
      practicalHint: 'O BCB é o "banco dos bancos" e o executor da política monetária do país.'
    },
    {
      term: 'Copom (Comitê de Política Monetária)',
      category: 'Governança & Instituições',
      definition: 'Órgão colegiado do BCB, constituído pelo Presidente e pelos oito Diretores do Banco Central. Reúne-se ordinariamente a cada 45 dias (oito vezes ao ano) para avaliar as perspectivas da economia e fixar a taxa de juros básica da economia (Selic Meta).',
      practicalHint: 'Nas reuniões do Copom, o colegiado analisa o balanço de riscos da inflação antes de votar se eleva, mantém ou corta a taxa Selic.'
    },
    {
      term: 'Taxa Selic Meta',
      category: 'Taxas & Juros',
      definition: 'Taxa básica de juros fixada pelo Copom. Serve como a principal âncora nominal da economia brasileira, balizando o custo de captação de recursos, o rendimento de títulos de renda fixa e as taxas de juros cobradas em empréstimos e financiamentos a famílias e empresas.',
      practicalHint: 'Quando o Copom diz "a taxa básica agora é 10,50% a.a.", ele está se referindo à Selic Meta.'
    },
    {
      term: 'Taxa Selic Over',
      category: 'Taxas & Juros',
      definition: 'Taxa média diária ponderada das operações de empréstimos interbancários por um dia útil (overnight) lastreadas em títulos públicos federais, registradas e liquidadas no Sistema Especial de Liquidação e Custódia (Selic).',
      practicalHint: 'Diferença crucial: A Selic Meta é uma decisão política-econômica do Copom; a Selic Over é a taxa real efetivamente praticada pelos bancos no dia a dia do mercado interbancário.'
    },
    {
      term: 'Operações de Mercado Aberto (Open Market)',
      category: 'Instrumentos de Liquidez',
      definition: 'Compra e venda diária de títulos da dívida pública federal (LTN, LFT/Tesouro Selic) entre o Banco Central e os bancos comerciais (dealers). É o instrumento mais ágil e utilizado pelo BCB para calibrar a quantidade de moeda em circulação e garantir que a Selic Over fique alinhada à Selic Meta.',
      practicalHint: 'Vender títulos = retira moeda de circulação (política contracionista). Comprar títulos = injeta moeda na economia (política expansionista).'
    },
    {
      term: 'Depósito Compulsório (Reservas Obrigatórias)',
      category: 'Instrumentos de Liquidez',
      definition: 'Fração percentual dos depósitos captados pelos bancos comerciais (à vista, a prazo e poupança) que as instituições financeiras são obrigadas por lei a recolher em contas de custódia no Banco Central.',
      practicalHint: 'Ao aumentar o compulsório, o BCB reduz o poder de multiplicação de crédito dos bancos comerciais, enxugando os Meios de Pagamento (M1).'
    },
    {
      term: 'Multiplicador Monetário (m)',
      category: 'Instrumentos de Liquidez',
      definition: 'Coeficiente matemático que demonstra o quanto a Base Monetária (M0) é multiplicada pelo sistema financeiro através da criação de moeda escritural (depósitos bancários e novos empréstimos). Sua fórmula teórica clássica é m = (1 + c) / (c + r).',
      practicalHint: 'Quanto menor a retenção de moeda pelo público (c) e menor o compulsório (r), maior é a criação de moeda pelos bancos.'
    },
    {
      term: 'Taxa de Redesconto Bancário',
      category: 'Taxas & Juros',
      definition: 'Taxa de juros cobrada pelo Banco Central ao conceder empréstimos de liquidez emergencial a instituições financeiras que enfrentam descompassos temporários de caixa. O BCB atua nessa função como "Prestamista de Última Instância".',
      practicalHint: 'A taxa de redesconto é propositalmente mais cara que a Selic normal para punir bancos que operem com gestão imprudente de liquidez.'
    },
    {
      term: 'Base Monetária (M0)',
      category: 'Agregados Monetários',
      definition: 'Total do passivo monetário de alta potência emitido pela autoridade monetária. Compreende o Papel-Moeda Emitido (em poder do público + caixas dos bancos) somado às Reservas Bancárias mantidas no Banco Central.',
      practicalHint: 'O M0 é o alicerce fundamental sobre o qual todo o restante da moeda do país é multiplicado.'
    },
    {
      term: 'Meios de Pagamento Restritos (M1)',
      category: 'Agregados Monetários',
      definition: 'Representa a moeda de liquidez imediata que não rende juros e pode ser utilizada diretamente para transações na economia. É composto pelo Papel-Moeda em Poder do Público (PMPP) mais os Depósitos à Vista nos bancos comerciais.',
      practicalHint: 'M1 = Dinheiro físico nas carteiras + saldo em conta-corrente bancária movimentável por Pix ou cartão de débito.'
    },
    {
      term: 'Agregados Ampliados (M2, M3 e M4)',
      category: 'Agregados Monetários',
      definition: 'Conceitos que adicionam ao M1 os ativos financeiros de liquidez decrescente e que rendem juros: M2 inclui depósitos a prazo (CDBs) e caderneta de poupança; M3 agrega quotas de fundos de investimento e operações compromissadas; M4 engloba títulos públicos em poder do público.',
      practicalHint: 'Acompanhar os agregados ampliados permite ao BCB avaliar o nível de riqueza financeira e potencial de consumo futuro da população.'
    },
    {
      term: 'IPCA (Índice de Preços ao Consumidor Amplo)',
      category: 'Indicadores Macroeconômicos',
      definition: 'Índice oficial de inflação do Brasil, calculado e divulgado mensalmente pelo IBGE. Mede a variação de preços de uma cesta de consumo de famílias com renda entre 1 e 40 salários mínimos nas principais regiões metropolitanas.',
      practicalHint: 'É a métrica oficial que o Copom tem a obrigação legal de perseguir para cumprir a meta fixada pelo CMN.'
    },
    {
      term: 'Relatório Focus',
      category: 'Indicadores Macroeconômicos',
      definition: 'Publicação semanal divulgada pelo Banco Central às segundas-feiras, consolidando as expectativas de mais de 100 economistas e analistas de bancos, gestoras e consultorias a respeito de IPCA, PIB, Taxa Selic e Câmbio para o ano corrente e anos seguintes.',
      practicalHint: 'O Copom acompanha o Focus para verificar se as expectativas do mercado estão ancoradas na meta oficial.'
    },
    {
      term: 'Regra da Caderneta de Poupança (Lei 12.703/2012)',
      category: 'Taxas & Juros',
      definition: 'Regra jurídica brasileira que atrela o rendimento da poupança ao patamar da Selic Meta: Se a Selic Meta for superior a 8,5% a.a., a poupança rende 0,5% ao mês + TR (~6,17% a.a.). Se a Selic Meta for menor ou igual a 8,5% a.a., a poupança rende 70% da Selic Meta + TR.',
      practicalHint: 'Essa regra foi criada para evitar que, em momentos de juros muito baixos, a poupança oferecesse rentabilidade maior que os títulos públicos do Tesouro Nacional.'
    },
    {
      term: 'Hiato do Produto (Output Gap)',
      category: 'Indicadores Macroeconômicos',
      definition: 'Diferença entre o Produto Interno Bruto (PIB) efetivo de um país e o seu PIB potencial (nível máximo de produção que a economia consegue gerar sem acelerar a inflação). Hiato positivo gera pressões inflacionárias de demanda; hiato negativo indica desemprego e ociosidade de fábricas.',
      practicalHint: 'Se o hiato for positivo, o Banco Central tende a subir os juros para resfriar a economia e conter aumentos abusivos de preços.'
    }
  ];

  /**
   * Busca termos com base em texto livre ou categoria
   */
  function searchTerms(query = '', category = 'Todas') {
    const q = query.trim().toLowerCase();
    return TERMS.filter(t => {
      const matchCat = category === 'Todas' || t.category === category;
      const matchQuery = !q || 
        t.term.toLowerCase().includes(q) || 
        t.definition.toLowerCase().includes(q) || 
        t.practicalHint.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }

  function getCategories() {
    return ['Todas', 'Governança & Instituições', 'Taxas & Juros', 'Instrumentos de Liquidez', 'Agregados Monetários', 'Indicadores Macroeconômicos'];
  }

  return {
    TERMS,
    searchTerms,
    getCategories
  };
});
