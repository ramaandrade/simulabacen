/**
 * Suíte de Testes Automatizados — SimulaBacen
 * Valida os modelos matemáticos, multiplicador bancário, regra legal da poupança
 * e a dinâmica macroeconômica da autoridade monetária.
 */

const assert = require('assert');
const { CMN_TARGET, calculateMultiplier, calculatePoupancaYield, MacroEngine } = require('../js/model.js');

console.log('🧪 Iniciando testes do SimulaBacen...\n');

let passedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Testes de Multiplicador Monetário e Compulsório
test('Multiplicador bancário: r=0.25, c=0.20 deve resultar em m = 2.67', () => {
  const m = calculateMultiplier(0.25, 0.20);
  assert.strictEqual(m, 2.67);
});

test('Multiplicador bancário sob compulsório mais alto (política restritiva): r=0.40, c=0.20 -> m cai para 2.0', () => {
  const m = calculateMultiplier(0.40, 0.20);
  assert.strictEqual(m, 2.0);
});

// 2. Testes da Regra Legal da Poupança (Lei 12.703/2012)
test('Poupança quando Selic > 8.5% (ex: 10.5%): Rendimento deve ser fixo em 6.17% a.a.', () => {
  const yieldPoupanca = calculatePoupancaYield(10.50);
  assert.strictEqual(yieldPoupanca, 6.17);
});

test('Poupança quando Selic <= 8.5% (ex: 7.0%): Rendimento deve ser 70% da Selic (4.90% a.a.)', () => {
  const yieldPoupanca = calculatePoupancaYield(7.00);
  assert.strictEqual(yieldPoupanca, 4.90);
});

test('Poupança exatamente no limiar de 8.5%: Rendimento deve ser 70% da Selic (5.95% a.a.)', () => {
  const yieldPoupanca = calculatePoupancaYield(8.50);
  assert.strictEqual(yieldPoupanca, 5.95);
});

// 3. Testes do Motor Macroeconômico (MacroEngine)
test('Inicialização padrão possui Selic Meta de 10.50% e meta de inflação CMN de 3.00%', () => {
  const engine = new MacroEngine();
  const state = engine.getState();
  assert.strictEqual(state.selicMeta, 10.50);
  assert.strictEqual(CMN_TARGET.center, 3.00);
  assert.strictEqual(CMN_TARGET.min, 1.50);
  assert.strictEqual(CMN_TARGET.max, 4.50);
});

test('Reunião do Copom: Elevação de Selic (+0.75 p.p.) deve atualizar Selic Meta para 11.25%', () => {
  const engine = new MacroEngine();
  const res = engine.applyCopomDecision(0.75);
  assert.strictEqual(res.newMeta, 11.25);
  assert.strictEqual(engine.getState().selicMeta, 11.25);
  assert.strictEqual(engine.getState().round, 2);
});

test('Mesa de Open Market: Venda de títulos enxuga reservas bancárias', () => {
  const engine = new MacroEngine();
  const initialReserves = engine.getState().reservasBancarias;
  const res = engine.applyOpenMarketOperation('SELL', 20);
  assert.strictEqual(res.reservas, initialReserves - 20);
  assert.strictEqual(engine.getState().reservasBancarias, initialReserves - 20);
});

test('Mesa de Open Market: Compra de títulos injeta reservas bancárias', () => {
  const engine = new MacroEngine();
  const initialReserves = engine.getState().reservasBancarias;
  const res = engine.applyOpenMarketOperation('BUY', 30);
  assert.strictEqual(res.reservas, initialReserves + 30);
});

test('Canal de Transmissão: Rendimento do Tesouro Selic reflete fielmente a Selic Meta', () => {
  const engine = new MacroEngine();
  engine.applyCopomDecision(1.00); // 10.50 -> 11.50
  assert.strictEqual(engine.getState().rendimentoTesouroSelic, 11.50);
});

test('Cenários Históricos: Carregamento do cenário de Commodities ajusta IPCA alto inicial', () => {
  const engine = new MacroEngine();
  const state = engine.reset('commodities');
  assert.strictEqual(state.activeScenario, 'commodities');
  assert.strictEqual(state.ipca12m, 10.40);
  assert.strictEqual(state.focusExpectation, 9.80);
});

test('Cenários Históricos: Carregamento do cenário de Recessão ajusta PIB negativo', () => {
  const engine = new MacroEngine();
  const state = engine.reset('recessao');
  assert.strictEqual(state.activeScenario, 'recessao');
  assert.strictEqual(state.pibGrowth, -3.40);
});

test('Avaliação de Desempenho gera pontuação entre 0 e 100 e insígnia coerente', () => {
  const engine = new MacroEngine();
  const evalResult = engine.evaluatePerformance();
  assert(evalResult.totalScore >= 0 && evalResult.totalScore <= 100);
  assert(typeof evalResult.badge === 'string');
  assert(typeof evalResult.title === 'string');
});

console.log(`\n🎉 Todos os ${passedTests} testes passaram com sucesso!\n`);
