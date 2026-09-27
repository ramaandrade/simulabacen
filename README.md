# 🏛️ SimulaBacen — Simulador de Política Monetária do Banco Central do Brasil

> 🌐 **Acesso Online (GitHub Pages):** [https://ramaandrade.github.io/simulabacen/](https://ramaandrade.github.io/simulabacen/)  
> 📦 **Repositório GitHub:** [https://github.com/ramaandrade/simulabacen](https://github.com/ramaandrade/simulabacen)

**SimulaBacen** é um aplicativo web educativo, interativo e intuitivo, desenvolvido sob medida para estudantes de graduação dos cursos de Finanças, Ciências Econômicas, Administração e Ciências Contábeis vivenciarem a formulação e execução da **política monetária brasileira**.

---

## 🎯 Objetivo Educacional
Desmistificar o funcionamento prático do Banco Central do Brasil (BCB), permitindo que os alunos atuem como membros votantes do **Comitê de Política Monetária (Copom)** e operadores da **Mesa de Mercado Aberto (Open Market)**, compreendendo como as decisões de taxa de juros e controle de liquidez repercutem sobre a inflação (IPCA), o crédito, os investimentos e o nível de atividade econômica.

---

## ⚖️ Fundamentação Legal e Conceitual

Toda a lógica da simulação é estritamente pautada na legislação brasileira e no livro-texto macroeconômico:
1. **Conselho Monetário Nacional (CMN)**: Órgão deliberativo superior que define as metas de inflação (Meta central contínua de 3,00% com intervalo de tolerância de ±1,50 p.p. — banda entre 1,50% e 4,50%).
2. **Banco Central do Brasil (BCB)**: Autarquia federal executora da política da moeda e do crédito (Lei nº 4.595/1964 e LC nº 179/2021).
3. **Copom e a Taxa Selic Meta**: Colegiado que se reúne a cada 45 dias para deliberar sobre a taxa básica de juros da economia.
4. **Mesa do Open Market e Taxa Selic Over**: Operações compromissadas diárias com títulos da dívida pública federal (LFT/LTN) para alinhar a taxa overnight do mercado interbancário (Selic Over) à Selic Meta.
5. **Depósito Compulsório e Multiplicador Bancário**: Manejo das reservas bancárias obrigatórias e criação de moeda escritural pelo sistema bancário comercial:
   $$m = \frac{1 + c}{c + r}$$
   Onde $r$ é a alíquota do compulsório e $c$ a retenção de papel-moeda pelo público.
6. **Regra Legal da Poupança (Lei nº 12.703/2012)**:
   * **Se Selic > 8,5% a.a.**: Rentabilidade de 0,5% ao mês + TR (~6,17% a.a.).
   * **Se Selic $\le$ 8,5% a.a.**: Rentabilidade de 70% da Selic Meta + TR.
7. **Taxa de Redesconto**: Instrumento em que o BCB atua como prestamista de última instância, provendo liquidez emergencial com spread punitivo sobre a Selic.

---

## 🚀 Como Executar o Projeto

### Opção 1: Execução Direta no Navegador (Zero Instalação)
Basta abrir o arquivo `index.html` em qualquer navegador web moderno (Chrome, Edge, Firefox, Safari). O aplicativo foi construído com tecnologias web nativas (HTML5, CSS3 e JavaScript ES6+) e não necessita de etapas de compilação ou banco de dados externo.

### Opção 2: Servidor Local via Node.js
Para rodar como servidor web local em salas de aula ou laboratórios de informática:
```bash
# Iniciar o servidor HTTP
npm start
# ou: node server.js
```
Acesse no navegador: `http://localhost:3300`

---

## 🧪 Testes Automatizados

Para executar a suíte de testes de validação matemática das regras monetárias e financeiras:
```bash
npm test
# ou: node tests/simulation.test.js
```

---

## 🕹️ Os 4 Módulos do Aplicativo

### Módulo 1: Reunião do Copom
* Análise do Relatório Focus, IPCA acumulado em 12 meses, câmbio USD/BRL e hiato do produto.
* Votação em colegiado (elevações, manutenção ou cortes de juros).
* Geração instantânea da **Ata Oficial do Copom** formatada no padrão institucional do Banco Central (pronta para impressão ou entrega como trabalho acadêmico).
* Gráficos dinâmicos de projeção do IPCA em relação à banda do CMN.

### Módulo 2: Mesa de Operações do Open Market
* Intervenções diárias: **Vender Títulos** (retirar liquidez) vs. **Comprar Títulos** (injetar liquidez).
* Alavanca do **Depósito Compulsório** (10% a 50%) com recálculo em tempo real do multiplicador bancário e expansão da moeda escritural (M1).
* Janela emergencial do **Redesconto Bancário**.
* Gráficos e termômetros da **Base Monetária (M0)** vs. **Meios de Pagamento (M1)** e agregados ampliados (M2, M3 e M4).

### Módulo 3: Simulador de Impacto na Economia Real
* **Canal do Crédito**: Taxas médias de empréstimos PF e PJ, inadimplência e volume de concessões.
* **Canal dos Investimentos**: Rentabilidade do Tesouro Selic, Caderneta de Poupança (com indicação da regra legal), CDB 100% CDI e termômetro de atratividade da Bolsa de Valores (Ibovespa).
* **Canal da Atividade & Emprego**: Comportamento do PIB / IBC-Br e hiato do produto.
* **Termômetro da Inflação**: Régua visual destacando piso (1,5%), centro (3,0%) e teto (4,5%) do CMN.

### Módulo 4: Modo Desafio Histórico (Gamificado)
* **Cenário 1: Choque de Commodities (2021–2022)**: IPCA em 10,4% e expectativas desancoradas. Conduza aperto monetário firme sem estrangular a atividade econômica.
* **Cenário 2: Desaceleração Econômica e Recessão (2016–2017)**: PIB em -3,4% e juros herdados em 13,75%. Conduza afrouxamento monetário para reativar o crédito.
* **Cenário 3: Crise de Liquidez Bancária (2008)**: Pânico interbancário e escassez de reservas. Atue como prestamista de última instância.
* **Sistema de Avaliação**: Nota de 0 a 100, conceitos acadêmicos (A+, A, B, C, D), insígnias honorárias e parecer oficial do CMN.

---

## 📖 Dicionário e Glossário Integrado
Inclui mais de 15 verbetes detalhados com a definição formal e dicas práticas universitárias para consulta imediata durante as simulações.
