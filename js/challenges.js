/**
 * SimulaBacen — Módulo 4: Modo Desafio Histórico (Gamificado)
 * Três cenários inspirados em episódios marcantes da história macroeconômica brasileira,
 * com objetivos quantitativos, sistema de pontuação de 0 a 100 e feedbacks pedagógicos.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ChallengesModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const SCENARIOS = {
    commodities: {
      id: 'commodities',
      title: 'Choque de Commodities e Inflação em Alta',
      subtitle: 'Inspirado nos choques globais de oferta e alimentos (2021–2022)',
      icon: '🔥',
      color: 'danger',
      maxRounds: 5,
      narrativa: `Choques no preço do petróleo internacional, quebra de safras agrícolas e disrupções nas cadeias logísticas globais fizeram o IPCA brasileiro disparar para 10,40% ao ano. A Selic inicial encontra-se defasada em 6,50% a.a., gerando juro real negativo e alimentando expectativas desancoradas no Relatório Focus (9,80%). O câmbio está pressionado em R$ 5,65.`,
      objetivos: [
        { id: 'inflacao', desc: 'Reconduzir o IPCA acumulado para o teto da meta (<= 4,50%)', target: 4.50 },
        { id: 'selic', desc: 'Elevar a Selic Meta para terreno contracionista acima de 11,00% a.a.', target: 11.00 },
        { id: 'pib', desc: 'Evitar colapso severo da atividade econômica (PIB > -1,00%)', target: -1.00 }
      ],
      dicaPedagogica: `Política Contracionista Rígida: Eleve a Selic de forma decidida (+0,75% ou +1,00% nas reuniões iniciais), realize vendas de títulos no Open Market para retirar liquidez e sinalize compromisso firme com a ancoragem das expectativas no comunicado.`
    },
    recessao: {
      id: 'recessao',
      title: 'Desaceleração Econômica e Recessão',
      subtitle: 'Inspirado na crise e ciclo de afrouxamento monetário (2016–2017)',
      icon: '📉',
      color: 'warning',
      maxRounds: 5,
      narrativa: `A economia brasileira enfrenta uma recessão profunda com PIB em contração (-3,40%), desemprego elevado e capacidade ociosa recorde na indústria. A inflação já recuou para 2,40% a.a., mas a taxa Selic herdada ainda está muito elevada em 13,75% a.a., travando o investimento produtivo e o crédito para famílias e empresas.`,
      objetivos: [
        { id: 'pib', desc: 'Reativar o crescimento econômico (levar PIB para >= +1,20%)', target: 1.20 },
        { id: 'selic', desc: 'Conduzir ciclo de afrouxamento, reduzindo a Selic para <= 8,00% a.a.', target: 8.00 },
        { id: 'inflacao', desc: 'Manter a inflação controlada dentro da banda de tolerância (1,50% a 4,50%)', target: 4.50 }
      ],
      dicaPedagogica: `Política Expansionista Harmonizada: Reduza a taxa Selic com consistência (-0,75% ou -1,00% por reunião), compre títulos no Open Market para injetar liquidez e avalie diminuir a alíquota do Depósito Compulsório para ampliar o multiplicador bancário.`
    },
    liquidez: {
      id: 'liquidez',
      title: 'Crise de Liquidez Bancária & Estresse Financeiro',
      subtitle: 'Inspirado na atuação do BCB durante a Crise Financeira Global de 2008',
      icon: '⚡',
      color: 'info',
      maxRounds: 4,
      narrativa: `Uma crise internacional de confiança congela os empréstimos interbancários. Instituições financeiras entesouram caixa e recusam-se a emprestar no mercado interbancário overnight. A taxa Selic Over disparou para 13,50%, descolando da meta de 11,25%. As reservas bancárias no BCB caíram para o nível crítico de R$ 30 bilhões, ameaçando a solvência do sistema financeiro.`,
      objetivos: [
        { id: 'reservas', desc: 'Recompor as reservas bancárias no BCB para nível seguro (>= R$ 65 bilhões)', target: 65 },
        { id: 'selicOver', desc: 'Fazer a Selic Over convergir novamente para próximo da Selic Meta (diferença <= 0,30 p.p.)', target: 0.30 },
        { id: 'solvencia', desc: 'Evitar disparada descontrolada da inadimplência (manter <= 5,0%)', target: 5.00 }
      ],
      dicaPedagogica: `Papel de Prestamista de Última Instância: Acione a Janela de Redesconto Bancário e realize compras emergenciais de títulos públicos federais na Mesa do Open Market para injetar moeda imediata e acalmar o pânico interbancário.`
    }
  };

  /**
   * Avalia o status dos objetivos do cenário atual
   */
  function checkObjectives(scenarioId, state) {
    const sc = SCENARIOS[scenarioId];
    if (!sc) return [];

    return sc.objetivos.map(obj => {
      let isMet = false;
      let currentVal = '';

      if (scenarioId === 'commodities') {
        if (obj.id === 'inflacao') {
          isMet = state.ipca12m <= obj.target;
          currentVal = `${state.ipca12m.toFixed(2)}% (Alvo: <= ${obj.target.toFixed(2)}%)`;
        } else if (obj.id === 'selic') {
          isMet = state.selicMeta >= obj.target;
          currentVal = `${state.selicMeta.toFixed(2)}% (Alvo: >= ${obj.target.toFixed(2)}%)`;
        } else if (obj.id === 'pib') {
          isMet = state.pibGrowth >= obj.target;
          currentVal = `${state.pibGrowth.toFixed(2)}% (Alvo: >= ${obj.target.toFixed(2)}%)`;
        }
      } else if (scenarioId === 'recessao') {
        if (obj.id === 'pib') {
          isMet = state.pibGrowth >= obj.target;
          currentVal = `${state.pibGrowth.toFixed(2)}% (Alvo: >= ${obj.target.toFixed(2)}%)`;
        } else if (obj.id === 'selic') {
          isMet = state.selicMeta <= obj.target;
          currentVal = `${state.selicMeta.toFixed(2)}% (Alvo: <= ${obj.target.toFixed(2)}%)`;
        } else if (obj.id === 'inflacao') {
          isMet = state.ipca12m >= 1.50 && state.ipca12m <= obj.target;
          currentVal = `${state.ipca12m.toFixed(2)}% (Banda: 1,50% a 4,50%)`;
        }
      } else if (scenarioId === 'liquidez') {
        if (obj.id === 'reservas') {
          isMet = state.reservasBancarias >= obj.target;
          currentVal = `R$ ${state.reservasBancarias.toFixed(1)} bi (Alvo: >= R$ ${obj.target} bi)`;
        } else if (obj.id === 'selicOver') {
          const diff = Math.abs(state.selicOver - state.selicMeta);
          isMet = diff <= obj.target;
          currentVal = `Diferença de ${diff.toFixed(2)} p.p. (Alvo: <= 0,30 p.p.)`;
        } else if (obj.id === 'solvencia') {
          isMet = state.inadimplencia <= obj.target;
          currentVal = `${state.inadimplencia.toFixed(2)}% (Alvo: <= ${obj.target.toFixed(2)}%)`;
        }
      }

      return {
        id: obj.id,
        desc: obj.desc,
        isMet,
        currentVal
      };
    });
  }

  /**
   * Conclui o cenário e gera o boletim de notas acadêmico
   */
  function buildFinalReport(scenarioId, state, engineEvaluation) {
    const sc = SCENARIOS[scenarioId];
    const objectives = checkObjectives(scenarioId, state);
    const metCount = objectives.filter(o => o.isMet).length;
    const totalCount = objectives.length;

    // Nota final: 60% objetivos cumpridos + 40% score geral macroeconômico
    const objScore = Math.round((metCount / totalCount) * 100);
    const finalScore = Math.round((objScore * 0.60) + (engineEvaluation.totalScore * 0.40));

    let conceito = 'D';
    if (finalScore >= 90) conceito = 'A+ (Excelente)';
    else if (finalScore >= 80) conceito = 'A (Muito Bom)';
    else if (finalScore >= 70) conceito = 'B (Bom)';
    else if (finalScore >= 50) conceito = 'C (Regular)';

    let parecer = '';
    if (scenarioId === 'commodities') {
      parecer = finalScore >= 75
        ? 'Parabéns! Sua atuação enérgica conteve a espiral inflacionária sem estrangular a atividade econômica do país. Você restaurou a credibilidade da meta do CMN.'
        : 'Atenção aos canais de transmissão: a inflação permaneceu elevada ou a economia sofreu choque desproporcional. Revise a intensidade dos aumentos de taxa Selic.';
    } else if (scenarioId === 'recessao') {
      parecer = finalScore >= 75
        ? 'Excelente condução! O ciclo gradual de cortes de juros e expansão de liquidez reaqueceu a economia e o crédito, mantendo a inflação dentro dos parâmetros da meta.'
        : 'O alívio monetário foi insuficiente ou tardio, prolongando a retração do PIB, ou foi precipitado a ponto de pressionar a inflação além da meta.';
    } else if (scenarioId === 'liquidez') {
      parecer = finalScore >= 75
        ? 'Atuação exemplar como Prestamista de Última Instância! O fornecimento de liquidez via redesconto e compras no open market impediu um colapso financeiro sistêmico.'
        : 'O sistema permaneceu com descolamento da taxa Selic Over ou as reservas não foram recompostas a tempo. Em crises agudas de liquidez, a injeção deve ser rápida e segura.';
    }

    return {
      scenarioTitle: sc.title,
      finalScore,
      conceito,
      metCount,
      totalCount,
      objectives,
      parecer,
      badge: engineEvaluation.badge,
      title: engineEvaluation.title
    };
  }

  return {
    SCENARIOS,
    checkObjectives,
    buildFinalReport
  };
});
