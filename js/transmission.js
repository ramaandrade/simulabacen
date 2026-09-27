/**
 * SimulaBacen — Módulo 3: Simulador de Impacto na Economia Real (Canais de Transmissão)
 * Detalha como as variações de taxa de juros e liquidez se propagam pelo crédito,
 * investimentos, nível de emprego/atividade e inflação final (IPCA).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TransmissionModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Avalia a situação do canal de crédito
   */
  function evaluateCreditChannel(state) {
    const selic = state.selicMeta;
    let status = 'Moderado';
    let descricao = '';

    if (selic >= 13.00) {
      status = 'Crédito Restritivo & Caro';
      descricao = 'Taxas de financiamento elevadas inibem compras parceladas de bens duráveis (veículos, eletrodomésticos) e investimentos corporativos, arrefecendo a demanda.';
    } else if (selic <= 7.50) {
      status = 'Crédito Farto & Estimulante';
      descricao = 'Custo do dinheiro barato incentiva o endividamento produtivo das empresas e o consumo das famílias, acelerando o volume de concessões de empréstimos.';
    } else {
      status = 'Crédito Equilibrado';
      descricao = 'Taxas de juros em nível intermediário, compatíveis com a estabilidade de concessões sem gerar bolhas de inadimplência.';
    }

    return {
      status,
      descricao,
      taxaPF: state.taxaCreditoPF,
      taxaPJ: state.taxaCreditoPJ,
      inadimplencia: state.inadimplencia,
      concessoes: state.concessoesCredito
    };
  }

  /**
   * Avalia a situação do canal de investimentos
   */
  function evaluateInvestmentsChannel(state) {
    const selic = state.selicMeta;
    const poupanca = state.rendimentoPoupanca;
    const regraPoupanca = selic > 8.50 
      ? 'Regra da Selic > 8,5%: Rentabilidade fixa de 0,5% a.m. + TR (~6,17% a.a.)'
      : 'Regra da Selic <= 8,5%: Rentabilidade de 70% da taxa Selic Meta + TR';

    let atratividadeBolsaTexto = '';
    if (state.atratividadeBolsa > 70) {
      atratividadeBolsaTexto = 'Alta atratividade para a Bolsa (ações). Com a Selic baixa, investidores migram da renda fixa em busca de maiores retornos na renda variável.';
    } else if (state.atratividadeBolsa < 40) {
      atratividadeBolsaTexto = 'Baixa atratividade para a Bolsa. A taxa Selic de dois dígitos oferece retorno expressivo em ativos de renda fixa quase sem risco (Tesouro Selic e CDBs), provocando saída de capital de ações.';
    } else {
      atratividadeBolsaTexto = 'Equilíbrio entre Renda Fixa e Variável. Portfólios diversificados com prêmio de risco moderado.';
    }

    return {
      regraPoupanca,
      atratividadeBolsaTexto,
      tesouroSelic: state.rendimentoTesouroSelic,
      poupanca: poupanca,
      cdb: state.rendimentoCDB,
      scoreBolsa: state.atratividadeBolsa
    };
  }

  /**
   * Avalia o canal de atividade e emprego
   */
  function evaluateActivityChannel(state) {
    const pib = state.pibGrowth;
    let classificacao = '';
    let cor = 'info';

    if (pib < 0) {
      classificacao = 'Recessão / Contração da Atividade Econômica';
      cor = 'danger';
    } else if (pib < 1.5) {
      classificacao = 'Crescimento Lento / Abaixo do Potencial';
      cor = 'warning';
    } else if (pib <= 3.5) {
      classificacao = 'Crescimento Sustentável (Próximo ao Potencial)';
      cor = 'success';
    } else {
      classificacao = 'Superaquecimento Econômico (Risco de Inflação de Demanda)';
      cor = 'danger';
    }

    return {
      classificacao,
      cor,
      pib: pib,
      hiato: state.hiatoProduto,
      dolar: state.dolarRate
    };
  }

  /**
   * Avalia o termômetro de inflação frente à meta do CMN
   */
  function evaluateInflationThermometer(ipca, cmnTarget) {
    const center = cmnTarget.center; // 3.00
    const min = cmnTarget.min;       // 1.50
    const max = cmnTarget.max;       // 4.50

    let status = '';
    let statusClass = '';
    let recomendacao = '';

    if (ipca > max) {
      status = 'ESTOURO DO TETO DA META';
      statusClass = 'danger';
      recomendacao = 'Inflação descumprindo o regime de metas. Exige comunicação pública obrigatória do Presidente do BCB em carta aberta ao Ministro da Fazenda/CMN justificando o desvio e providências.';
    } else if (ipca > center + 0.5) {
      status = 'ACIMA DO CENTRO (ALERTA)';
      statusClass = 'warning';
      recomendacao = 'Inflação na metade superior da banda de tolerância. Recomenda-se cautela ou manutenção de viés restritivo na Selic.';
    } else if (ipca >= min && ipca <= center + 0.5) {
      status = 'DENTRO DA META DO CMN';
      statusClass = 'success';
      recomendacao = 'Política monetária bem calibrada. Inflação convergindo harmoniosamente com a meta central estipulada pelo CMN.';
    } else {
      status = 'ABAIXO DO PISO DA META';
      statusClass = 'warning';
      recomendacao = 'Risco de desinflação excessiva ou deflação em setores chave, desestimulando novos investimentos e receitas empresariais.';
    }

    return {
      ipca,
      center,
      min,
      max,
      status,
      statusClass,
      recomendacao
    };
  }

  return {
    evaluateCreditChannel,
    evaluateInvestmentsChannel,
    evaluateActivityChannel,
    evaluateInflationThermometer
  };
});
