/**
 * SimulaBacen — Motor de Simulação Macroeconômica e Monetária
 * Fundamentado na estrutura institucional e operacional do Banco Central do Brasil (BCB)
 * e do Conselho Monetário Nacional (CMN).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SimulaModel = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // Constantes Institucionais e Normativas (CMN & BCB)
  const CMN_TARGET = {
    center: 3.00,        // Meta contínua de inflação (IPCA) fixada pelo CMN
    tolerance: 1.50,     // Intervalo de tolerância (±1,50 p.p.)
    min: 1.50,           // Piso da meta
    max: 4.50            // Teto da meta
  };

  const DEFAULT_STATE = {
    // Ciclo e Tempo
    round: 1,
    meetingNumber: 1,
    year: 2026,
    maxRounds: 8,        // 8 reuniões por ano (ciclos de 45 dias)
    activeScenario: null, // null para modo livre sandbox, ou 'commodities', 'recessao', 'liquidez'

    // Taxas Básicas e Mercado Interbancário
    selicMeta: 10.50,    // Fixada pelo Copom (% a.a.)
    selicOver: 10.40,    // Taxa média apurada nas operações do Selic (% a.a.)
    taxaRedesconto: 12.50, // Taxa do redesconto (Selic + spread)

    // Instrumentos do BCB
    openMarketOperation: 0, // Saldo de intervenção (+ injeta liquidez, - enxuga em R$ bi)
    compulsorioRatio: 0.25, // Alíquota do Depósito Compulsório à vista (25%)
    currencyRatio: 0.20,    // Relação papel-moeda em poder do público / depósitos à vista (c)

    // Agregados Monetários (em R$ Bilhões)
    baseMonetariaM0: 420.0, // Papel-moeda emitido + Reservas bancárias
    reservasBancarias: 85.0,
    papelMoedaEmitido: 335.0,
    pmpp: 280.0,            // Papel-moeda em poder do público
    depositosVista: 700.0,  // Depósitos à vista nos bancos comerciais
    m1: 980.0,              // M1 = PMPP + Depósitos à vista
    m2: 4600.0,             // M1 + depósitos a prazo (CDB) + poupança
    m3: 6500.0,             // M2 + fundos de renda fixa + compromissadas
    m4: 8200.0,             // M3 + títulos públicos em poder do público

    // Conjuntura Macroeconômica
    ipca12m: 3.80,          // Inflação acumulada em 12 meses (% a.a.)
    focusExpectation: 3.90, // Expectativa de inflação do Relatório Focus (% a.a.)
    pibGrowth: 2.20,        // Crescimento do PIB acumulado (% a.a.)
    hiatoProduto: 0.10,     // Hiato do produto (% do PIB potencial)
    dolarRate: 5.15,        // Taxa de câmbio R$/US$
    riscoPais: 210,         // CDS 5 anos (pontos base)

    // Canais de Transmissão (Economia Real)
    taxaCreditoPF: 42.50,   // Taxa média de crédito pessoa física (% a.a.)
    taxaCreditoPJ: 21.00,   // Taxa média de crédito pessoa jurídica (% a.a.)
    inadimplencia: 3.40,    // Índice de inadimplência do crédito (%)
    concessoesCredito: 510, // Índice de volume de concessões (base 500)
    
    // Investimentos
    rendimentoTesouroSelic: 10.50, // 100% Selic Meta
    rendimentoPoupanca: 6.17,      // Regra legal da Poupança
    rendimentoCDB: 10.30,          // 100% CDI (~ Selic Over - 0.10%)
    atratividadeBolsa: 62,         // Índice de atratividade de Renda Variável (0-100)

    // Histórico para gráficos
    history: []
  };

  /**
   * Calcula o multiplicador bancário e a expansão da moeda escritural
   * Fórmula padrão: m = (1 + c) / (c + r)
   * Onde:
   * c = papel-moeda em poder do público / depósitos à vista
   * r = alíquota de depósito compulsório / reservas obrigatórias
   */
  function calculateMultiplier(r, c) {
    if (r + c <= 0) return 1.0;
    const m = (1 + c) / (c + r);
    return Math.round(m * 100) / 100;
  }

  /**
   * Calcula o rendimento oficial da caderneta de poupança (Lei nº 12.703/2012)
   * Se Selic Meta > 8,5% a.a.: 0,5% ao mês + TR (~6,17% a.a. considerando TR nula/mínima)
   * Se Selic Meta <= 8,5% a.a.: 70% da Selic Meta + TR
   */
  function calculatePoupancaYield(selicMeta, tr = 0.0) {
    if (selicMeta > 8.50) {
      // 0,5% a.m. composto anual = (1 + 0.005)^12 - 1 = 6.1678%
      return Math.round((6.17 + tr) * 100) / 100;
    } else {
      return Math.round((0.70 * selicMeta + tr) * 100) / 100;
    }
  }

  /**
   * Classe principal do Modelo Macroeconômico do SimulaBacen
   */
  class MacroEngine {
    constructor(initialState = {}) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      Object.assign(this.state, initialState);
      this.recordHistory();
    }

    /**
     * Registra o estado atual para séries temporais e gráficos
     */
    recordHistory() {
      const snap = {
        round: this.state.round,
        meetingNumber: this.state.meetingNumber,
        year: this.state.year,
        selicMeta: this.state.selicMeta,
        selicOver: this.state.selicOver,
        ipca12m: this.state.ipca12m,
        cmnTarget: CMN_TARGET.center,
        cmnMin: CMN_TARGET.min,
        cmnMax: CMN_TARGET.max,
        pibGrowth: this.state.pibGrowth,
        m0: this.state.baseMonetariaM0,
        m1: this.state.m1,
        dolar: this.state.dolarRate,
        creditoPF: this.state.taxaCreditoPF,
        poupanca: this.state.rendimentoPoupanca
      };
      this.state.history.push(snap);
    }

    /**
     * Reinicia para o estado padrão ou para um cenário específico
     */
    reset(scenarioKey = null) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.state.activeScenario = scenarioKey;
      this.state.history = [];

      if (scenarioKey === 'commodities') {
        // Cenário 1: Choque de Commodities & Inflação em Alta (estilo 2021-2022)
        this.state.ipca12m = 10.40;
        this.state.focusExpectation = 9.80;
        this.state.selicMeta = 6.50;
        this.state.selicOver = 6.40;
        this.state.pibGrowth = 3.80;
        this.state.dolarRate = 5.65;
        this.state.riscoPais = 310;
        this.state.compulsorioRatio = 0.20;
      } else if (scenarioKey === 'recessao') {
        // Cenário 2: Desaceleração Econômica e Recessão (estilo 2016-2017)
        this.state.ipca12m = 2.40;
        this.state.focusExpectation = 2.80;
        this.state.selicMeta = 13.75;
        this.state.selicOver = 13.65;
        this.state.pibGrowth = -3.40;
        this.state.hiatoProduto = -2.80;
        this.state.dolarRate = 4.90;
        this.state.taxaCreditoPF = 52.00;
        this.state.inadimplencia = 5.80;
        this.state.compulsorioRatio = 0.30;
      } else if (scenarioKey === 'liquidez') {
        // Cenário 3: Crise de Liquidez Bancária & Estresse Financeiro (estilo 2008)
        this.state.ipca12m = 4.90;
        this.state.focusExpectation = 4.70;
        this.state.selicMeta = 11.25;
        this.state.selicOver = 13.50; // Selic Over descolou por falta de liquidez interbancária!
        this.state.pibGrowth = 0.50;
        this.state.dolarRate = 5.80;
        this.state.reservasBancarias = 30.0; // Reservas críticas
        this.state.taxaRedesconto = 16.00;
        this.state.inadimplencia = 4.90;
      }

      this.recalculateAggregates();
      this.recalculateTransmission();
      this.recordHistory();
      return this.getState();
    }

    /**
     * Atualiza cálculos monetários (M0, Multiplicador, M1, M2...)
     */
    recalculateAggregates() {
      const r = this.state.compulsorioRatio;
      const c = this.state.currencyRatio;
      const multiplier = calculateMultiplier(r, c);

      // M0 = Papel Moeda Emitido + Reservas Bancárias
      this.state.baseMonetariaM0 = Math.round((this.state.papelMoedaEmitido + this.state.reservasBancarias) * 10) / 10;
      
      // M1 = M0 * Multiplicador
      this.state.m1 = Math.round(this.state.baseMonetariaM0 * multiplier * 10) / 10;
      this.state.depositosVista = Math.round((this.state.m1 - this.state.pmpp) * 10) / 10;

      // Agregados Ampliados
      this.state.m2 = Math.round((this.state.m1 + 3600 + (this.state.selicMeta * 20)) * 10) / 10;
      this.state.m3 = Math.round((this.state.m2 + 1900) * 10) / 10;
      this.state.m4 = Math.round((this.state.m3 + 1700) * 10) / 10;
    }

    /**
     * Aplica uma decisão da Reunião do Copom sobre a Selic Meta
     * delta: variação em pontos percentuais (ex: +0.50, 0.0, -0.25)
     */
    applyCopomDecision(delta) {
      const oldMeta = this.state.selicMeta;
      this.state.selicMeta = Math.max(1.0, Math.min(25.0, Math.round((oldMeta + delta) * 100) / 100));

      // Selic Over gravita ao redor da Selic Meta com base nas operações de open market
      // Se não houver choque grave de liquidez, Selic Over fica aproximadamente (Selic Meta - 0.10%)
      if (this.state.activeScenario !== 'liquidez' || this.state.reservasBancarias > 60) {
        this.state.selicOver = Math.round((this.state.selicMeta - 0.10) * 100) / 100;
      }

      // Atualiza taxa de redesconto (Selic Meta + spread punitivo de liquidez)
      this.state.taxaRedesconto = Math.round((this.state.selicMeta + 2.00) * 100) / 100;

      // Avança a rodada do Copom (45 dias)
      this.state.meetingNumber += 1;
      if (this.state.meetingNumber > 8) {
        this.state.meetingNumber = 1;
        this.state.year += 1;
      }
      this.state.round += 1;

      // Transmissão macroeconômica gerada pela decisão
      this.simulateMacroDynamics(delta);
      this.recalculateTransmission();
      this.recalculateAggregates();
      this.recordHistory();

      return {
        previousMeta: oldMeta,
        newMeta: this.state.selicMeta,
        delta: delta,
        round: this.state.round,
        meetingNumber: this.state.meetingNumber,
        year: this.state.year,
        ipca12m: this.state.ipca12m,
        pibGrowth: this.state.pibGrowth
      };
    }

    /**
     * Executa operação de Mercado Aberto (Open Market)
     * @param {string} action - 'SELL' (BCB vende títulos, enxuga moeda) ou 'BUY' (BCB compra títulos, injeta moeda)
     * @param {number} volume - Volume em R$ Bilhões (ex: 20 bi)
     */
    applyOpenMarketOperation(action, volume = 15) {
      const vol = Math.abs(volume);
      if (action === 'SELL') {
        // Política Contracionista: Vende títulos, bancos pagam com reservas
        // Retira liquidez do sistema -> Reservas bancárias caem
        this.state.reservasBancarias = Math.max(15, this.state.reservasBancarias - vol);
        this.state.openMarketOperation -= vol;

        // Se havia excesso de liquidez pressionando Selic Over para baixo, a venda puxa a Over para a Meta
        if (this.state.selicOver < this.state.selicMeta) {
          this.state.selicOver = Math.min(this.state.selicMeta, Math.round((this.state.selicOver + 0.15) * 100) / 100);
        }
      } else if (action === 'BUY') {
        // Política Expansionista: Compra títulos, BCB credita reservas dos bancos
        // Injeta liquidez -> Reservas bancárias sobem
        this.state.reservasBancarias += vol;
        this.state.openMarketOperation += vol;

        // Se havia escassez extrema (Selic Over > Meta, como na crise de liquidez), alivia o estresse
        if (this.state.selicOver > this.state.selicMeta) {
          this.state.selicOver = Math.max(this.state.selicMeta - 0.10, Math.round((this.state.selicOver - 0.35) * 100) / 100);
        }
      }

      this.recalculateAggregates();
      this.recalculateTransmission();
      return {
        action,
        volume: vol,
        reservas: this.state.reservasBancarias,
        selicOver: this.state.selicOver,
        m0: this.state.baseMonetariaM0,
        m1: this.state.m1
      };
    }

    /**
     * Ajusta a alíquota do Depósito Compulsório
     * @param {number} newRatio - Alíquota decimal (ex: 0.20 para 20%, até 0.50)
     */
    setCompulsorioRatio(newRatio) {
      const r = Math.max(0.10, Math.min(0.50, newRatio));
      this.state.compulsorioRatio = Math.round(r * 100) / 100;
      this.recalculateAggregates();
      this.recalculateTransmission();
      return {
        compulsorioRatio: this.state.compulsorioRatio,
        multiplier: calculateMultiplier(this.state.compulsorioRatio, this.state.currencyRatio),
        m1: this.state.m1
      };
    }

    /**
     * Aciona a Janela de Redesconto (Prestamista de Última Instância)
     * Fornece liquidez emergencial aos bancos com deficiência de caixa
     */
    triggerRedescontoEmergency(volume = 20) {
      this.state.reservasBancarias += volume;
      // Normaliza a taxa interbancária Selic Over
      this.state.selicOver = Math.round((this.state.selicMeta - 0.05) * 100) / 100;
      this.recalculateAggregates();
      this.recalculateTransmission();
      return {
        volume,
        reservas: this.state.reservasBancarias,
        selicOver: this.state.selicOver
      };
    }

    /**
     * Dinâmica Macroeconômica da Economia Brasileira
     * Modela a curva de Phillips, mecanismo de transmissão da Selic, hiato do produto e expectativas
     */
    simulateMacroDynamics(deltaSelic) {
      const selic = this.state.selicMeta;
      const juroNeutro = 4.50; // Juro real neutro estimado da economia brasileira (aprox. 4,5% a.a.)
      const inflacaoEsperada = this.state.focusExpectation;
      const juroReal = selic - inflacaoEsperada;

      // 1. Efeito no Câmbio (Diferencial de juros atrai capital se juros sobem)
      // Alta de juros valoriza o Real (reduz taxa R$/US$); Corte desvaloriza
      const cambioImpact = -0.15 * deltaSelic;
      this.state.dolarRate = Math.max(4.00, Math.min(6.80, Math.round((this.state.dolarRate + cambioImpact) * 100) / 100));

      // 2. Hiato do Produto e Crescimento do PIB
      // Juro real acima do neutro contrai atividade econômica; abaixo estimula
      const desvioJuroReal = juroReal - juroNeutro;
      const pibDinamica = -0.35 * desvioJuroReal;
      
      // Choques externos se cenário ativo
      let choquePIB = 0;
      let choqueInflacao = 0;
      if (this.state.activeScenario === 'commodities' && this.state.round <= 3) {
        choqueInflacao += 0.40; // Pressão importada contínua de petróleo/alimentos
      } else if (this.state.activeScenario === 'recessao' && this.state.round <= 3) {
        choquePIB -= 0.30;     // Inércia de estagnação
      }

      this.state.hiatoProduto = Math.round((this.state.hiatoProduto * 0.70 + (pibDinamica * 0.30)) * 100) / 100;
      this.state.pibGrowth = Math.round((2.00 + this.state.hiatoProduto * 0.90 + choquePIB) * 100) / 100;

      // 3. Inflação (IPCA 12m)
      // Baseada na curva de Phillips: inércia passada + hiato do produto + pass-through cambial + choque
      const inercia = this.state.ipca12m * 0.55;
      const pressaoHiato = this.state.hiatoProduto * 0.35;
      const passThroughCambial = (this.state.dolarRate - 5.00) * 0.20;
      const ancoragemFocus = this.state.focusExpectation * 0.25;

      const novoIpca = inercia + pressaoHiato + passThroughCambial + ancoragemFocus + choqueInflacao;
      this.state.ipca12m = Math.max(0.5, Math.min(18.0, Math.round(novoIpca * 100) / 100));

      // 4. Expectativas Focus (reagem à credibilidade do BCB e à convergência para a meta)
      const erroMeta = this.state.ipca12m - CMN_TARGET.center;
      // Se BCB subiu a Selic com inflação alta, ancoragem Focus melhora
      let melhoraCredibilidade = 0;
      if (this.state.ipca12m > CMN_TARGET.max && deltaSelic > 0) {
        melhoraCredibilidade = -0.30 * deltaSelic;
      } else if (this.state.ipca12m < CMN_TARGET.min && deltaSelic < 0) {
        melhoraCredibilidade = -0.20 * deltaSelic;
      }

      const novoFocus = (this.state.focusExpectation * 0.60) + (this.state.ipca12m * 0.25) + (CMN_TARGET.center * 0.15) + melhoraCredibilidade;
      this.state.focusExpectation = Math.max(1.0, Math.min(15.0, Math.round(novoFocus * 100) / 100));
    }

    /**
     * Recalcula os 4 eixos do Painel de Transmissão para a Economia Real
     */
    recalculateTransmission() {
      const selic = this.state.selicMeta;

      // 1. Custo do Crédito
      // Spread bancário brasileiro (custo de captação atrelado à Selic + inadimplência + tributos)
      const spreadPF = 32.0;
      const spreadPJ = 10.5;
      this.state.taxaCreditoPF = Math.round((selic + spreadPF + (this.state.inadimplencia * 1.5)) * 10) / 10;
      this.state.taxaCreditoPJ = Math.round((selic + spreadPJ + (this.state.inadimplencia * 0.8)) * 10) / 10;

      // Inadimplência reage com defasagem ao encarecimento do crédito e atividade
      const pressaoInadimplencia = (this.state.taxaCreditoPF > 48 ? 0.3 : -0.2) + (this.state.pibGrowth < 1 ? 0.2 : -0.1);
      this.state.inadimplencia = Math.max(1.8, Math.min(9.5, Math.round((this.state.inadimplencia + pressaoInadimplencia * 0.3) * 100) / 100));

      // Concessões de crédito (juros altos inibem demanda)
      this.state.concessoesCredito = Math.round(600 - (selic * 12) + (this.state.pibGrowth * 15));

      // 2. Rendimento das Aplicações Financeiras
      this.state.rendimentoTesouroSelic = Math.round(selic * 100) / 100;
      this.state.rendimentoPoupanca = calculatePoupancaYield(selic);
      this.state.rendimentoCDB = Math.max(0.1, Math.round((this.state.selicOver - 0.10) * 100) / 100);

      // Atratividade da Bolsa (inversa à Selic: Selic alta favorece renda fixa sem risco)
      // Score 0 a 100
      const atratividade = Math.max(10, Math.min(95, Math.round(95 - (selic * 3.8) + (this.state.pibGrowth * 4.5))));
      this.state.atratividadeBolsa = atratividade;
    }

    /**
     * Avalia o desempenho das decisões (Score de 0 a 100)
     */
    evaluatePerformance() {
      // 1. Desempenho da Inflação (Peso 45%)
      // Meta do CMN é 3.00%, banda [1.50, 4.50]
      const distMeta = Math.abs(this.state.ipca12m - CMN_TARGET.center);
      let scoreInflacao = 100 - (distMeta * 22);
      if (this.state.ipca12m >= CMN_TARGET.min && this.state.ipca12m <= CMN_TARGET.max) {
        // Bônus por estar dentro da banda de tolerância
        scoreInflacao = Math.min(100, scoreInflacao + 10);
      }
      scoreInflacao = Math.max(0, Math.min(100, scoreInflacao));

      // 2. Desempenho do PIB e Emprego (Peso 30%)
      // Crescimento sustentável sem superaquecimento (2.0% a 3.5%)
      let scorePIB = 100;
      if (this.state.pibGrowth < 0) {
        scorePIB = Math.max(0, 50 + (this.state.pibGrowth * 18));
      } else if (this.state.pibGrowth > 4.5) {
        scorePIB = 80; // Superaquecimento
      } else {
        scorePIB = Math.min(100, 70 + (this.state.pibGrowth * 10));
      }

      // 3. Estabilidade do Sistema e Liquidez (Peso 25%)
      // Selic Over colada na Selic Meta e Reservas seguras (> 50 bi)
      const spreadOver = Math.abs(this.state.selicOver - this.state.selicMeta);
      let scoreLiquidez = 100 - (spreadOver * 25);
      if (this.state.reservasBancarias < 40) {
        scoreLiquidez -= 30;
      }
      scoreLiquidez = Math.max(0, Math.min(100, scoreLiquidez));

      // Média Ponderada
      const totalScore = Math.round((scoreInflacao * 0.45) + (scorePIB * 0.30) + (scoreLiquidez * 0.25));

      let badge = 'Analista em Formação';
      let title = 'Conselheiro Júnior';
      if (totalScore >= 90) {
        badge = '🏆 Guardião Notável da Moeda';
        title = 'Presidente Honorário do Banco Central';
      } else if (totalScore >= 75) {
        badge = '🥇 Mestre da Estabilidade Monetária';
        title = 'Diretor de Política Monetária Sênior';
      } else if (totalScore >= 60) {
        badge = '🥈 Condução Prudente';
        title = 'Membro Efetivo do Copom';
      } else {
        badge = '⚠️ Desafio de Ancoragem';
        title = 'Operador da Mesa Sob Supervisão';
      }

      return {
        totalScore,
        scoreInflacao: Math.round(scoreInflacao),
        scorePIB: Math.round(scorePIB),
        scoreLiquidez: Math.round(scoreLiquidez),
        badge,
        title,
        isInsideBand: this.state.ipca12m >= CMN_TARGET.min && this.state.ipca12m <= CMN_TARGET.max,
        cmnTarget: CMN_TARGET
      };
    }

    getState() {
      return JSON.parse(JSON.stringify(this.state));
    }
  }

  return {
    CMN_TARGET,
    DEFAULT_STATE,
    calculateMultiplier,
    calculatePoupancaYield,
    MacroEngine
  };
});
