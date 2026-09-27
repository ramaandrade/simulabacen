/**
 * SimulaBacen — Módulo 2: Mesa de Operações do Open Market
 * Manejo diário de liquidez bancária, Depósito Compulsório, Redesconto e Agregados Monetários (M0, M1).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.OpenMarketModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Explicação didática de como a intervenção no Open Market impacta as taxas e agregados
   */
  function explainOperation(action, volume, state) {
    if (action === 'SELL') {
      return {
        type: 'Contracionista (Enxugamento)',
        resumo: `O BCB VENDEU R$ ${volume} bilhões em títulos públicos federais (LFT / LTN).`,
        mecanismo: `Os bancos comerciais transferiram reservas bancárias para o BCB em troca dos títulos. Isso REDUZIU a base monetária disponível no sistema interbancário, elevando o custo de captação (Selic Over) e desestimulando a concessão excessiva de empréstimos.`,
        efeitoM0: `Diminuição imediata nas reservas bancárias e no M0.`,
        efeitoSelicOver: `A Selic Over se aproxima ou sobe em direção à Selic Meta (${state.selicMeta.toFixed(2)}% a.a.).`
      };
    } else {
      return {
        type: 'Expansionista (Injeção)',
        resumo: `O BCB COMPROU R$ ${volume} bilhões em títulos públicos federais das instituições financeiras.`,
        mecanismo: `O BCB creditou a conta de reservas bancárias dos bancos comerciais. Com mais moeda livre de reservas, os bancos têm maior folga para emprestar, reduzindo as taxas interbancárias e estimulando o crédito geral na economia.`,
        efeitoM0: `Aumento imediata nas reservas bancárias e no M0.`,
        efeitoSelicOver: `Alivia escassez de caixa e pressões de alta excessiva na Selic Over.`
      };
    }
  }

  /**
   * Explicação do efeito do Depósito Compulsório sobre o multiplicador bancário
   */
  function explainCompulsorio(ratio, multiplier) {
    const percent = Math.round(ratio * 100);
    return {
      aliquota: `${percent}%`,
      multiplicador: multiplier.toFixed(2),
      analise: `Para cada R$ 1,00 emitido na Base Monetária (M0), o sistema bancário comercial cria e multiplica R$ ${multiplier.toFixed(2)} em Meios de Pagamento Restritos (M1) através de depósitos à vista e empréstimos sucessivos. Uma alíquota maior de compulsório retira capacidade de multiplicação dos bancos.`
    };
  }

  /**
   * Explicação da função da Taxa de Redesconto
   */
  function explainRedesconto(taxaRedesconto, selicMeta) {
    const spread = (taxaRedesconto - selicMeta).toFixed(2);
    return {
      taxa: `${taxaRedesconto.toFixed(2)}% a.a.`,
      spreadPunitivo: `+${spread} p.p. sobre a Selic Meta`,
      papel: `O BCB atua como Prestamista de Última Instância. A taxa de redesconto é mais alta que a Selic de mercado justamente para desestimular que os bancos fiquem ilíquidos ou dependam do socorro contínuo da autoridade monetária.`
    };
  }

  return {
    explainOperation,
    explainCompulsorio,
    explainRedesconto
  };
});
