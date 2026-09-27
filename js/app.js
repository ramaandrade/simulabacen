/**
 * SimulaBacen — Controlador Principal da Aplicação (App Orchestrator)
 * Gerencia a interface, ciclos de eventos, renderização de gráficos Canvas nativos
 * e comunicação com os módulos de simulação.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Instanciação do Motor de Simulação
  const engine = new SimulaModel.MacroEngine();

  // Histórico da última ata gerada
  let lastAtaText = '';
  let lastCopomDelta = 0;
  let lastPreviousMeta = 10.50;

  // Estado dos Gráficos Canvas
  const canvasIpca = document.getElementById('chart-ipca');
  const canvasSelic = document.getElementById('chart-selic');
  const canvasAggregates = document.getElementById('chart-aggregates');

  // ==========================================
  // NAVEGAÇÃO DE ABAS
  // ==========================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    // Re-renderiza gráficos quando a aba fica visível
    if (tabId === 'tab-copom') {
      renderIpcaChart();
      renderSelicChart();
    } else if (tabId === 'tab-openmarket') {
      renderAggregatesChart();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // ==========================================
  // TEMA (DARK / LIGHT MODE)
  // ==========================================
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      btnThemeToggle.textContent = '🌙 Modo Escuro';
    } else {
      btnThemeToggle.textContent = '☀️ Modo Claro';
    }
    renderAllCharts();
  }

  btnThemeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
  });

  // ==========================================
  // ATUALIZAÇÃO GERAL DA INTERFACE (UI SYNC)
  // ==========================================
  function updateUI() {
    const state = engine.getState();
    const evalResult = engine.evaluatePerformance();

    // 1. Ticker Tape Superior
    document.getElementById('tt-selic-meta').textContent = `${state.selicMeta.toFixed(2)}% a.a.`;
    document.getElementById('tt-selic-over').textContent = `${state.selicOver.toFixed(2)}% a.a.`;
    document.getElementById('tt-ipca').textContent = `${state.ipca12m.toFixed(2)}%`;
    document.getElementById('tt-dolar').textContent = `R$ ${state.dolarRate.toFixed(2)}`;
    document.getElementById('tt-m0').textContent = `R$ ${state.baseMonetariaM0.toFixed(0)} bi`;
    document.getElementById('tt-m1').textContent = `R$ ${state.m1.toFixed(0)} bi`;
    document.getElementById('tt-pib').textContent = `${state.pibGrowth >= 0 ? '+' : ''}${state.pibGrowth.toFixed(2)}%`;

    const tt2Meta = document.getElementById('tt2-selic-meta');
    if (tt2Meta) {
      tt2Meta.textContent = `${state.selicMeta.toFixed(2)}% a.a.`;
      document.getElementById('tt2-selic-over').textContent = `${state.selicOver.toFixed(2)}% a.a.`;
      document.getElementById('tt2-ipca').textContent = `${state.ipca12m.toFixed(2)}%`;
      document.getElementById('tt2-dolar').textContent = `R$ ${state.dolarRate.toFixed(2)}`;
    }

    // 2. Macro KPI Ribbon
    document.getElementById('kpi-selic-meta').textContent = `${state.selicMeta.toFixed(2)}%`;
    document.getElementById('kpi-selic-prev').textContent = `${lastPreviousMeta.toFixed(2)}%`;
    document.getElementById('kpi-selic-over').textContent = `${state.selicOver.toFixed(2)}%`;
    
    const spread = (state.selicOver - state.selicMeta).toFixed(2);
    document.getElementById('kpi-over-spread').textContent = `${spread >= 0 ? '+' : ''}${spread} p.p.`;
    
    document.getElementById('kpi-ipca').textContent = `${state.ipca12m.toFixed(2)}%`;
    const ipcaBadge = document.getElementById('kpi-ipca-badge');
    if (state.ipca12m > SimulaModel.CMN_TARGET.max) {
      ipcaBadge.className = 'badge-tag danger';
      ipcaBadge.textContent = 'Acima do Teto';
    } else if (state.ipca12m < SimulaModel.CMN_TARGET.min) {
      ipcaBadge.className = 'badge-tag warning';
      ipcaBadge.textContent = 'Abaixo do Piso';
    } else {
      ipcaBadge.className = 'badge-tag success';
      ipcaBadge.textContent = 'Dentro da Meta';
    }

    document.getElementById('kpi-focus').textContent = `${state.focusExpectation.toFixed(2)}%`;
    document.getElementById('kpi-pib').textContent = `${state.pibGrowth >= 0 ? '+' : ''}${state.pibGrowth.toFixed(2)}%`;
    document.getElementById('kpi-hiato').textContent = `${state.hiatoProduto >= 0 ? '+' : ''}${state.hiatoProduto.toFixed(2)}%`;
    document.getElementById('kpi-round').textContent = `R${state.round} (${state.meetingNumber}ª/8)`;
    document.getElementById('kpi-year').textContent = state.year;

    // 3. Módulo 1 (Copom)
    document.getElementById('copom-conj-dolar').textContent = `R$ ${state.dolarRate.toFixed(2)}`;
    document.getElementById('copom-conj-cds').textContent = `${state.riscoPais} pts`;

    const advice = CopomModule.getDidacticAdvice(state);
    const boxEl = document.getElementById('copom-didactic-box');
    boxEl.className = `didactic-box ${advice.tone}`;
    document.getElementById('copom-didactic-text').innerHTML = `<strong>${advice.title}:</strong> ${advice.message}`;

    // 4. Módulo 2 (Open Market)
    const mult = SimulaModel.calculateMultiplier(state.compulsorioRatio, state.currencyRatio);
    document.getElementById('lbl-compulsorio-ratio').textContent = `${Math.round(state.compulsorioRatio * 100)}%`;
    document.getElementById('range-compulsorio').value = Math.round(state.compulsorioRatio * 100);
    document.getElementById('lbl-compulsorio-formula').innerHTML = `Multiplicador Bancário: <strong>m = (1 + c) / (c + r) = ${mult.toFixed(2)}</strong>. Quanto maior o compulsório, menor a capacidade de multiplicação de crédito pelos bancos.`;
    document.getElementById('lbl-redesconto-rate').textContent = `${state.taxaRedesconto.toFixed(2)}% a.a.`;

    document.getElementById('agg-m0').textContent = `R$ ${state.baseMonetariaM0.toFixed(0)} bi`;
    document.getElementById('agg-reservas').textContent = `R$ ${state.reservasBancarias.toFixed(0)} bi`;
    document.getElementById('agg-multiplier').textContent = `${mult.toFixed(2)}x`;
    document.getElementById('agg-m1').textContent = `R$ ${state.m1.toFixed(0)} bi`;
    document.getElementById('lbl-m2').textContent = `R$ ${state.m2.toFixed(0)} bi`;
    document.getElementById('lbl-m3').textContent = `R$ ${state.m3.toFixed(0)} bi`;
    document.getElementById('lbl-m4').textContent = `R$ ${state.m4.toFixed(0)} bi`;

    // 5. Módulo 3 (Transmissão)
    const transCredit = TransmissionModule.evaluateCreditChannel(state);
    document.getElementById('trans-credit-badge').textContent = transCredit.status;
    document.getElementById('trans-taxa-pf').textContent = `${transCredit.taxaPF.toFixed(1)}%`;
    document.getElementById('trans-taxa-pj').textContent = `${transCredit.taxaPJ.toFixed(1)}%`;
    document.getElementById('trans-inadimplencia').textContent = `${transCredit.inadimplencia.toFixed(2)}%`;
    document.getElementById('trans-concessoes').textContent = `${transCredit.concessoes} pts`;
    document.getElementById('trans-credit-desc').textContent = transCredit.descricao;

    const transInvest = TransmissionModule.evaluateInvestmentsChannel(state);
    document.getElementById('trans-tesouro').textContent = `${transInvest.tesouroSelic.toFixed(2)}%`;
    document.getElementById('trans-poupanca').textContent = `${transInvest.poupanca.toFixed(2)}%`;
    document.getElementById('trans-poupanca-rule').textContent = state.selicMeta > 8.5 ? 'Selic > 8,5% (0,5% a.m.)' : 'Selic ≤ 8,5% (70% Selic)';
    document.getElementById('trans-cdb').textContent = `${transInvest.cdb.toFixed(2)}%`;
    document.getElementById('trans-bolsa-score').textContent = `${transInvest.scoreBolsa} / 100`;
    document.getElementById('trans-invest-desc').textContent = transInvest.atratividadeBolsaTexto;

    const transAct = TransmissionModule.evaluateActivityChannel(state);
    document.getElementById('trans-pib-badge').className = `badge-tag ${transAct.cor}`;
    document.getElementById('trans-pib-badge').textContent = transAct.cor === 'success' ? 'Sustentável' : 'Atenção';
    document.getElementById('trans-pib-val').textContent = `${transAct.pib >= 0 ? '+' : ''}${transAct.pib.toFixed(2)}%`;
    document.getElementById('trans-hiato-val').textContent = `${transAct.hiato >= 0 ? '+' : ''}${transAct.hiato.toFixed(2)}%`;
    document.getElementById('trans-activity-desc').textContent = transAct.classificacao;

    const transIpca = TransmissionModule.evaluateInflationThermometer(state.ipca12m, SimulaModel.CMN_TARGET);
    const transIpcaBadge = document.getElementById('trans-ipca-status-badge');
    transIpcaBadge.className = `badge-tag ${transIpca.statusClass}`;
    transIpcaBadge.textContent = transIpca.status;
    document.getElementById('trans-ipca-val').textContent = `${state.ipca12m.toFixed(2)}%`;
    document.getElementById('trans-ipca-desc').textContent = transIpca.recomendacao;

    // Atualiza marcador na régua da inflação (0% a 10%)
    const pct = Math.max(0, Math.min(100, (state.ipca12m / 10.0) * 100));
    document.getElementById('trans-ipca-marker').style.left = `${pct}%`;

    // 6. Módulo 4 (Desafio Ativo)
    if (state.activeScenario) {
      updateChallengeUI();
    }

    // Renderiza Gráficos Canvas
    renderAllCharts();
  }

  // ==========================================
  // RENDERIZADOR DE GRÁFICOS CANVAS
  // ==========================================
  function getThemeColors() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    return {
      bg: isDark ? '#0c1626' : '#ffffff',
      grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      text: isDark ? '#94a3b8' : '#64748b',
      target: '#f59e0b',
      band: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.20)',
      line1: '#38bdf8',
      line2: '#10b981',
      line3: '#ef4444',
      line4: '#a855f7'
    };
  }

  function renderIpcaChart() {
    if (!canvasIpca) return;
    const ctx = canvasIpca.getContext('2d');
    const width = canvasIpca.width;
    const height = canvasIpca.height;
    const colors = getThemeColors();
    const history = engine.getState().history;

    ctx.clearRect(0, 0, width, height);

    // Padding
    const pLeft = 45;
    const pRight = 20;
    const pTop = 25;
    const pBottom = 35;
    const chartW = width - pLeft - pRight;
    const chartH = height - pTop - pBottom;

    // Escala Y: 0% a 12%
    const minY = 0.0;
    const maxY = Math.max(12.0, ...history.map(h => h.ipca12m + 1.0));

    function getY(val) {
      return pTop + chartH - ((val - minY) / (maxY - minY)) * chartH;
    }

    function getX(idx, total) {
      if (total <= 1) return pLeft + chartW / 2;
      return pLeft + (idx / (total - 1)) * chartW;
    }

    // Banda de tolerância CMN [1.50% a 4.50%]
    const yMinBand = getY(1.50);
    const yMaxBand = getY(4.50);
    ctx.fillStyle = colors.band;
    ctx.fillRect(pLeft, yMaxBand, chartW, yMinBand - yMaxBand);

    // Linhas de Grade e Eixos
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = colors.text;

    [0, 1.5, 3.0, 4.5, 6.0, 9.0, 12.0].forEach(yVal => {
      if (yVal <= maxY) {
        const y = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(pLeft, y);
        ctx.lineTo(width - pRight, y);
        ctx.stroke();
        ctx.fillText(`${yVal.toFixed(1)}%`, 6, y + 3);
      }
    });

    // Linha da Meta Central (3.00%)
    const yCenter = getY(3.00);
    ctx.strokeStyle = colors.target;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pLeft, yCenter);
    ctx.lineTo(width - pRight, yCenter);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Meta 3,0%', width - 75, yCenter - 4);

    // Curva do IPCA Histórico
    if (history.length > 0) {
      ctx.strokeStyle = colors.line1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      history.forEach((h, i) => {
        const x = getX(i, history.length);
        const y = getY(h.ipca12m);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Pontos e Rótulos
      history.forEach((h, i) => {
        const x = getX(i, history.length);
        const y = getY(h.ipca12m);
        ctx.fillStyle = colors.line1;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.text;
        ctx.fillText(`R${h.round}`, x - 8, height - 12);
      });
    }
  }

  function renderSelicChart() {
    if (!canvasSelic) return;
    const ctx = canvasSelic.getContext('2d');
    const width = canvasSelic.width;
    const height = canvasSelic.height;
    const colors = getThemeColors();
    const history = engine.getState().history;

    ctx.clearRect(0, 0, width, height);

    const pLeft = 45;
    const pRight = 20;
    const pTop = 20;
    const pBottom = 35;
    const chartW = width - pLeft - pRight;
    const chartH = height - pTop - pBottom;

    const minY = 0.0;
    const maxY = Math.max(16.0, ...history.map(h => Math.max(h.selicMeta, h.selicOver) + 1.0));

    function getY(val) {
      return pTop + chartH - ((val - minY) / (maxY - minY)) * chartH;
    }
    function getX(idx, total) {
      if (total <= 1) return pLeft + chartW / 2;
      return pLeft + (idx / (total - 1)) * chartW;
    }

    // Grid
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = colors.text;

    [0, 4, 8, 12, 16].forEach(yVal => {
      if (yVal <= maxY) {
        const y = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(pLeft, y);
        ctx.lineTo(width - pRight, y);
        ctx.stroke();
        ctx.fillText(`${yVal}%`, 10, y + 3);
      }
    });

    // Curva Selic Meta (Azul)
    ctx.strokeStyle = colors.line1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = getX(i, history.length);
      const y = getY(h.selicMeta);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Curva Selic Over (Verde)
    ctx.strokeStyle = colors.line2;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = getX(i, history.length);
      const y = getY(h.selicOver);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Pontos
    history.forEach((h, i) => {
      const x = getX(i, history.length);
      ctx.fillStyle = colors.line1;
      ctx.beginPath();
      ctx.arc(x, getY(h.selicMeta), 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.text;
      ctx.fillText(`R${h.round}`, x - 8, height - 12);
    });

    // Legenda
    ctx.fillStyle = colors.line1;
    ctx.fillText('● Selic Meta', pLeft + 10, pTop + 10);
    ctx.fillStyle = colors.line2;
    ctx.fillText('--- Selic Over', pLeft + 110, pTop + 10);
  }

  function renderAggregatesChart() {
    if (!canvasAggregates) return;
    const ctx = canvasAggregates.getContext('2d');
    const width = canvasAggregates.width;
    const height = canvasAggregates.height;
    const colors = getThemeColors();
    const history = engine.getState().history;

    ctx.clearRect(0, 0, width, height);

    const pLeft = 55;
    const pRight = 20;
    const pTop = 20;
    const pBottom = 35;
    const chartW = width - pLeft - pRight;
    const chartH = height - pTop - pBottom;

    const maxVal = Math.max(1200, ...history.map(h => h.m1 + 100));

    function getY(val) {
      return pTop + chartH - (val / maxVal) * chartH;
    }
    function getX(idx, total) {
      if (total <= 1) return pLeft + chartW / 2;
      return pLeft + (idx / (total - 1)) * chartW;
    }

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = colors.text;

    [0, 300, 600, 900, 1200].forEach(yVal => {
      if (yVal <= maxVal) {
        const y = getY(yVal);
        ctx.beginPath();
        ctx.moveTo(pLeft, y);
        ctx.lineTo(width - pRight, y);
        ctx.stroke();
        ctx.fillText(`R$ ${yVal}`, 6, y + 3);
      }
    });

    // M1 (Verde)
    ctx.strokeStyle = colors.line2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = getX(i, history.length);
      const y = getY(h.m1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // M0 (Azul)
    ctx.strokeStyle = colors.line1;
    ctx.lineWidth = 3;
    ctx.beginPath();
    history.forEach((h, i) => {
      const x = getX(i, history.length);
      const y = getY(h.m0);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Legenda
    ctx.fillStyle = colors.line2;
    ctx.fillText('● M1 (Meios de Pagamento)', pLeft + 10, pTop + 10);
    ctx.fillStyle = colors.line1;
    ctx.fillText('● M0 (Base Monetária)', pLeft + 190, pTop + 10);
  }

  function renderAllCharts() {
    renderIpcaChart();
    renderSelicChart();
    renderAggregatesChart();
  }

  // ==========================================
  // EVENTOS DO MÓDULO 1: COPOM
  // ==========================================
  function handleCopomVote(delta) {
    const state = engine.getState();
    lastPreviousMeta = state.selicMeta;
    lastCopomDelta = delta;

    const result = engine.applyCopomDecision(delta);
    lastAtaText = CopomModule.generateAtaText(engine.getState(), delta, lastPreviousMeta);

    // Se estiver em modo desafio, verifica progresso
    if (state.activeScenario) {
      const ch = ChallengesModule.SCENARIOS[state.activeScenario];
      if (engine.getState().round > ch.maxRounds) {
        showFinalReportModal();
      }
    }

    updateUI();
  }

  document.querySelectorAll('.btn-vote').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseFloat(btn.getAttribute('data-delta'));
      handleCopomVote(delta);
    });
  });

  const btnApplyCustom = document.getElementById('btn-apply-custom-vote');
  const inputCustom = document.getElementById('input-custom-delta');
  if (btnApplyCustom && inputCustom) {
    btnApplyCustom.addEventListener('click', () => {
      const delta = parseFloat(inputCustom.value) || 0.0;
      handleCopomVote(delta);
    });
  }

  // Modal da Ata do Copom
  const modalAta = document.getElementById('modal-ata-overlay');
  const btnOpenAta = document.getElementById('btn-open-ata');
  const btnViewLastAta = document.getElementById('btn-view-last-ata');
  const btnCloseAta = document.getElementById('btn-close-ata-modal');
  const modalAtaText = document.getElementById('modal-ata-text');

  function openAtaModal() {
    if (!lastAtaText) {
      lastAtaText = CopomModule.generateAtaText(engine.getState(), lastCopomDelta, lastPreviousMeta);
    }
    modalAtaText.textContent = lastAtaText;
    modalAta.classList.add('active');
  }

  if (btnOpenAta) btnOpenAta.addEventListener('click', openAtaModal);
  if (btnViewLastAta) btnViewLastAta.addEventListener('click', openAtaModal);
  if (btnCloseAta) btnCloseAta.addEventListener('click', () => modalAta.classList.remove('active'));

  document.getElementById('btn-copy-ata').addEventListener('click', () => {
    navigator.clipboard.writeText(modalAtaText.textContent).then(() => {
      alert('Ata Oficial do Copom copiada com sucesso para a área de transferência!');
    });
  });

  document.getElementById('btn-print-ata').addEventListener('click', () => {
    window.print();
  });

  // ==========================================
  // EVENTOS DO MÓDULO 2: OPEN MARKET
  // ==========================================
  const btnSell = document.getElementById('btn-openmarket-sell');
  const btnBuy = document.getElementById('btn-openmarket-buy');
  const rangeCompulsorio = document.getElementById('range-compulsorio');
  const btnRedesconto = document.getElementById('btn-trigger-redesconto');
  const openFeedbackText = document.getElementById('openmarket-feedback-text');

  btnSell.addEventListener('click', () => {
    const res = engine.applyOpenMarketOperation('SELL', 15);
    const exp = OpenMarketModule.explainOperation('SELL', 15, engine.getState());
    openFeedbackText.innerHTML = `<strong>${exp.type}:</strong> ${exp.mecanismo} Reservas atuais: <strong>R$ ${res.reservas.toFixed(1)} bi</strong>.`;
    updateUI();
  });

  btnBuy.addEventListener('click', () => {
    const res = engine.applyOpenMarketOperation('BUY', 15);
    const exp = OpenMarketModule.explainOperation('BUY', 15, engine.getState());
    openFeedbackText.innerHTML = `<strong>${exp.type}:</strong> ${exp.mecanismo} Reservas atuais: <strong>R$ ${res.reservas.toFixed(1)} bi</strong>.`;
    updateUI();
  });

  rangeCompulsorio.addEventListener('input', (e) => {
    const ratio = parseFloat(e.target.value) / 100.0;
    engine.setCompulsorioRatio(ratio);
    updateUI();
  });

  btnRedesconto.addEventListener('click', () => {
    const res = engine.triggerRedescontoEmergency(20);
    openFeedbackText.innerHTML = `<strong>Prestamista de Última Instância Ativado:</strong> BCB proveu R$ 20 bi em liquidez emergencial aos bancos. Selic Over normalizada para <strong>${res.selicOver.toFixed(2)}% a.a.</strong>`;
    updateUI();
  });

  // ==========================================
  // EVENTOS DO MÓDULO 4: DESAFIOS HISTÓRICOS
  // ==========================================
  const scenarioCards = document.querySelectorAll('.scenario-card');
  const activePanel = document.getElementById('active-challenge-panel');
  const btnFinishChallenge = document.getElementById('btn-finish-challenge');

  function startChallenge(scenarioKey) {
    engine.reset(scenarioKey);
    const sc = ChallengesModule.SCENARIOS[scenarioKey];

    document.getElementById('badge-active-mode').textContent = `Desafio: ${sc.title}`;
    document.getElementById('badge-active-mode').className = 'bcb-badge-tag';

    activePanel.style.display = 'flex';
    document.getElementById('ch-active-title').textContent = sc.title;
    document.getElementById('ch-active-narrative').innerHTML = `<strong>Contexto Histórico:</strong> ${sc.narrativa}`;
    document.getElementById('ch-active-hint-text').textContent = sc.dicaPedagogica;

    scenarioCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-scenario') === scenarioKey);
    });

    updateChallengeUI();
    updateUI();
    switchTab('tab-copom'); // Redireciona para o Copom para começar a agir
  }

  function updateChallengeUI() {
    const state = engine.getState();
    const sc = ChallengesModule.SCENARIOS[state.activeScenario];
    if (!sc) return;

    document.getElementById('ch-active-round-tracker').textContent = `Reunião ${state.round} de ${sc.maxRounds}`;

    const objectives = ChallengesModule.checkObjectives(state.activeScenario, state);
    const objContainer = document.getElementById('ch-active-objectives-list');
    objContainer.innerHTML = '';

    objectives.forEach(obj => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.justifyContent = 'space-between';
      div.style.alignItems = 'center';
      div.style.background = 'var(--bg-surface)';
      div.style.padding = '8px 12px';
      div.style.borderRadius = 'var(--radius-sm)';
      div.style.fontSize = '0.85rem';
      div.style.border = '1px solid var(--border-subtle)';

      div.innerHTML = `
        <div>
          <span>${obj.isMet ? '✅' : '⏳'}</span>
          <span style="font-weight: 500; margin-left: 6px;">${obj.desc}</span>
        </div>
        <div>
          <span class="badge-tag ${obj.isMet ? 'success' : 'warning'}">${obj.currentVal}</span>
        </div>
      `;
      objContainer.appendChild(div);
    });
  }

  scenarioCards.forEach(card => {
    card.addEventListener('click', () => {
      const scenarioKey = card.getAttribute('data-scenario');
      startChallenge(scenarioKey);
    });
  });

  function showFinalReportModal() {
    const state = engine.getState();
    const evalRes = engine.evaluatePerformance();
    const report = ChallengesModule.buildFinalReport(state.activeScenario, state, evalRes);

    const body = document.getElementById('modal-report-body');
    body.innerHTML = `
      <div style="text-align: center; padding: 10px 0;">
        <div style="font-size: 3rem; margin-bottom: 4px;">${report.badge.split(' ')[0]}</div>
        <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--gold);">${report.badge}</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Cargo Honorário: <strong>${report.title}</strong></p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0;">
        <div style="background: var(--bg-surface); padding: 14px; text-align: center; border-radius: var(--radius-sm);">
          <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Nota Final CMN</div>
          <div style="font-size: 1.8rem; font-weight: 800; font-family: var(--font-mono); color: var(--blue-light);">${report.finalScore} / 100</div>
        </div>
        <div style="background: var(--bg-surface); padding: 14px; text-align: center; border-radius: var(--radius-sm);">
          <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Conceito Acadêmico</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--green-stable);">${report.conceito}</div>
        </div>
        <div style="background: var(--bg-surface); padding: 14px; text-align: center; border-radius: var(--radius-sm);">
          <div style="font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;">Metas Cumpridas</div>
          <div style="font-size: 1.8rem; font-weight: 800; font-family: var(--font-mono);">${report.metCount} / ${report.totalCount}</div>
        </div>
      </div>

      <div class="didactic-box info">
        <div>🎓</div>
        <div><strong>Parecer Técnico do Colegiado:</strong> ${report.parecer}</div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Status Final dos Objetivos do Desafio:</h4>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${report.objectives.map(o => `
            <div style="display: flex; justify-content: space-between; font-size: 0.82rem; background: var(--bg-surface); padding: 8px 10px; border-radius: 4px;">
              <span>${o.isMet ? '✅' : '❌'} ${o.desc}</span>
              <strong style="color: ${o.isMet ? 'var(--green-stable)' : 'var(--red-alert)'}">${o.currentVal}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('modal-report-overlay').classList.add('active');
  }

  if (btnFinishChallenge) {
    btnFinishChallenge.addEventListener('click', showFinalReportModal);
  }

  document.getElementById('btn-close-report-modal').addEventListener('click', () => {
    document.getElementById('modal-report-overlay').classList.remove('active');
  });

  document.getElementById('btn-return-sandbox').addEventListener('click', () => {
    document.getElementById('modal-report-overlay').classList.remove('active');
    engine.reset(null);
    document.getElementById('badge-active-mode').textContent = 'Modo Livre / Sandbox';
    activePanel.style.display = 'none';
    scenarioCards.forEach(c => c.classList.remove('active'));
    updateUI();
  });

  document.getElementById('btn-print-report').addEventListener('click', () => {
    window.print();
  });

  // ==========================================
  // EVENTOS DO MÓDULO 5: GLOSSÁRIO
  // ==========================================
  const searchInput = document.getElementById('glossary-search-input');
  const catSelect = document.getElementById('glossary-category-select');
  const cardsContainer = document.getElementById('glossary-cards-container');

  function renderGlossary() {
    const q = searchInput.value;
    const cat = catSelect.value;
    const terms = GlossaryModule.searchTerms(q, cat);

    cardsContainer.innerHTML = '';
    terms.forEach(t => {
      const card = document.createElement('div');
      card.className = 'glossary-card';
      card.innerHTML = `
        <div class="glossary-cat">${t.category}</div>
        <div class="glossary-term">${t.term}</div>
        <div class="glossary-def">${t.definition}</div>
        <div class="glossary-hint"><strong>💡 Na prática universitária:</strong> ${t.practicalHint}</div>
      `;
      cardsContainer.appendChild(card);
    });
  }

  searchInput.addEventListener('input', renderGlossary);
  catSelect.addEventListener('change', renderGlossary);

  document.getElementById('btn-quick-glossary').addEventListener('click', () => {
    switchTab('tab-glossary');
  });

  // ==========================================
  // REINICIAR SIMULAÇÃO
  // ==========================================
  document.getElementById('btn-reset-sim').addEventListener('click', () => {
    if (confirm('Deseja reiniciar a simulação para os valores padrões de mercado?')) {
      engine.reset(null);
      lastAtaText = '';
      lastCopomDelta = 0;
      lastPreviousMeta = 10.50;
      document.getElementById('badge-active-mode').textContent = 'Modo Livre / Sandbox';
      activePanel.style.display = 'none';
      scenarioCards.forEach(c => c.classList.remove('active'));
      updateUI();
    }
  });

  // Inicialização Inicial
  renderGlossary();
  updateUI();
  renderAllCharts();

  // Redimensionamento responsivo de canvas
  window.addEventListener('resize', () => {
    renderAllCharts();
  });
});
