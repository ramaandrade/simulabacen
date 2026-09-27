/**
 * SimulaBacen — Módulo 1: Reunião do Copom (Comitê de Política Monetária)
 * Gerencia a análise de conjuntura, processo de votação da Selic Meta e geração da Ata Oficial.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CopomModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Gera o comunicado e texto formal da Ata do Copom baseado na decisão tomada
   */
  function generateAtaText(state, decisionDelta, previousMeta) {
    const meetingNum = 260 + state.round;
    const year = state.year || 2026;
    const newSelic = state.selicMeta;
    const ipca = state.ipca12m;
    const target = 3.00;
    const pib = state.pibGrowth;
    const dolar = state.dolarRate;

    let actionWord = 'manteve';
    let deltaText = 'inalterada';
    if (decisionDelta > 0) {
      actionWord = 'elevou';
      deltaText = `em +${decisionDelta.toFixed(2)} ponto(s) percentual(is)`;
    } else if (decisionDelta < 0) {
      actionWord = 'reduziu';
      deltaText = `em ${decisionDelta.toFixed(2)} ponto(s) percentual(is)`;
    }

    let inflacaoDiagnostico = '';
    if (ipca > 4.50) {
      inflacaoDiagnostico = `O Copom nota com preocupação que a inflação acumulada em 12 meses (${ipca.toFixed(2)}%) encontra-se acima do limite superior da meta estabelecida pelo Conselho Monetário Nacional (CMN). As expectativas apuradas pelo Relatório Focus (${state.focusExpectation.toFixed(2)}%) demandam rigorosa perseverança na política monetária contracionista para assegurar a convergência ao longo do horizonte relevante.`;
    } else if (ipca < 1.50) {
      inflacaoDiagnostico = `A inflação acumulada (${ipca.toFixed(2)}%) situa-se abaixo do piso da meta estipulada pelo CMN. A autoridade monetária monitora o risco de desinflação excessiva e fraqueza na demanda agregada, justificando incentivo à atividade produtiva.`;
    } else {
      inflacaoDiagnostico = `A inflação acumulada (${ipca.toFixed(2)}%) evolui dentro do intervalo de tolerância da meta (1,50% a 4,50%), aproximando-se do objetivo central de 3,00%. O Comitê segue vigilante quanto aos choques de custos e à dinâmica dos serviços subjacentes.`;
    }

    let atividadeDiagnostico = '';
    if (pib < 0) {
      atividadeDiagnostico = `Os indicadores recentes de atividade econômica revelam contração do produto interno (PIB em ${pib.toFixed(2)}%), com hiato negativo e ociosidade dos fatores de produção.`;
    } else if (pib > 3.5) {
      atividadeDiagnostico = `A economia mantém ritmo vigoroso de expansão (PIB em ${pib.toFixed(2)}%), operando próximo do pleno emprego, o que requer atenção para não gerar pressões adicionais de demanda.`;
    } else {
      atividadeDiagnostico = `A atividade econômica exibe trajetória compatível com o crescimento potencial do país (PIB em ${pib.toFixed(2)}%), sem indícios imediatos de desequilíbrio na capacidade instalada.`;
    }

    return `BANCO CENTRAL DO BRASIL
COMITÊ DE POLÍTICA MONETÁRIA (COPOM)
================================================================================
ATA DA ${meetingNum}ª REUNIÃO ORDINÁRIA DO COPOM — EXERCÍCIO DE ${year}
================================================================================

1. DELIBERAÇÃO OFICIAL:
O Comitê de Política Monetária (Copom) do Banco Central do Brasil, por decisão
unânime de seus membros, ${actionWord} a taxa Selic Meta ${deltaText},
fixando-a em ${newSelic.toFixed(2)}% ao ano (anteriormente em ${previousMeta.toFixed(2)}% a.a.).

2. ATUALIZAÇÃO DO CENÁRIO MACROECONÔMICO:
${inflacaoDiagnostico}

3. ATIVIDADE ECONÔMICA E MERCADO DE TRABALHO:
${atividadeDiagnostico}
O mercado de crédito opera com taxa de câmbio referencial em R$ ${dolar.toFixed(2)} por dólar.

4. BALANÇO DE RISCOS:
Entre os riscos de alta para o cenário inflacionário destacam-se:
(i) maior persistência das pressões inflacionárias globais e commodities;
(ii) desancoragem prolongada das expectativas de longo prazo;
(iii) eventuais pressões na política fiscal e no risco-país.

Entre os riscos de baixa ressaltam-se:
(i) desaceleração mais acentuada da atividade econômica global e crédito doméstico;
(ii) choques favoráveis na oferta de energia e alimentos.

5. DIRETRIZES DA POLÍTICA MONETÁRIA:
A presente decisão reflete a estratégia do Banco Central de assegurar a
estabilidade do poder de compra da moeda nacional (Real) e zelar pela solidez
do Sistema Financeiro Nacional, pautando-se pelo regime de metas de inflação do CMN.

Brasília, ${state.meetingNumber}º Ciclo de ${year}.
Comitê de Política Monetária — Banco Central do Brasil.`;
  }

  /**
   * Fornece recomendações didáticas com base na situação macro atual
   */
  function getDidacticAdvice(state) {
    const ipca = state.ipca12m;
    const focus = state.focusExpectation;
    const pib = state.pibGrowth;

    if (ipca > 4.50 || focus > 4.50) {
      return {
        tone: 'danger',
        title: 'Alerta de Inflação Acima da Meta!',
        message: `O IPCA está em ${ipca.toFixed(2)}%, acima do teto de 4,50%. O livro-texto recomenda ELEVAR a taxa Selic (política contracionista) para encarecer o crédito, moderar a demanda e ancorar as expectativas do Focus.`
      };
    } else if (pib < 0 && ipca < 3.50) {
      return {
        tone: 'warning',
        title: 'Estagnação / Recessão com Inflação Controlada',
        message: `O PIB está em retração (${pib.toFixed(2)}%) enquanto a inflação está controlada. Há espaço técnico para REDUZIR a taxa Selic (política expansionista), estimulando o crédito e o consumo.`
      };
    } else {
      return {
        tone: 'success',
        title: 'Cenário Equilibrado',
        message: `A inflação (${ipca.toFixed(2)}%) está próxima do centro da meta (3,00%) e a atividade se sustenta. O Copom pode avaliar MANTER a Selic para calibrar os efeitos das decisões passadas.`
      };
    }
  }

  return {
    generateAtaText,
    getDidacticAdvice
  };
});
