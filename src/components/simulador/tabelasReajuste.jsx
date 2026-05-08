/**
 * Tabelas de reenquadramento etário por seguradora.
 * 
 * Cada seguradora tem um array de faixas: { de, ate, percentual }
 * O percentual é o reajuste ANUAL aplicado ao mudar de faixa etária.
 * 
 * A MetLife usa apenas o IPCA como fator de reajuste (sem reenquadramento etário).
 * 
 * IMPORTANTE: Estes são valores placeholder. O usuário enviará as tabelas reais
 * de cada seguradora para atualizar os percentuais.
 */

export const SEGURADORAS = [
  {
    id: "metlife",
    nome: "MetLife",
    cor: "#00A651",      // Verde vibrante
    destaque: true,      // Destacar no gráfico
    tipo: "ipca",        // Só aplica IPCA, sem reenquadramento etário
    faixas: []           // Não tem faixas - reajuste é apenas IPCA
  },
  {
    id: "prudential",
    nome: "Prudential",
    cor: "#E53935",      // Vermelho
    tipo: "etario",
    faixas: [
      { de: 18, ate: 30, percentual: 0 },
      { de: 31, ate: 35, percentual: 10 },
      { de: 36, ate: 40, percentual: 15 },
      { de: 41, ate: 45, percentual: 20 },
      { de: 46, ate: 50, percentual: 30 },
      { de: 51, ate: 55, percentual: 40 },
      { de: 56, ate: 60, percentual: 55 },
      { de: 61, ate: 65, percentual: 70 },
      { de: 66, ate: 70, percentual: 90 },
      { de: 71, ate: 80, percentual: 100 },
    ]
  },
  {
    id: "mongeral",
    nome: "Mongeral Aegon",
    cor: "#1E88E5",      // Azul
    tipo: "etario",
    faixas: [
      { de: 18, ate: 30, percentual: 0 },
      { de: 31, ate: 35, percentual: 8 },
      { de: 36, ate: 40, percentual: 12 },
      { de: 41, ate: 45, percentual: 18 },
      { de: 46, ate: 50, percentual: 28 },
      { de: 51, ate: 55, percentual: 38 },
      { de: 56, ate: 60, percentual: 50 },
      { de: 61, ate: 65, percentual: 65 },
      { de: 66, ate: 70, percentual: 85 },
      { de: 71, ate: 80, percentual: 100 },
    ]
  },
  {
    id: "porto_seguro",
    nome: "Porto Seguro",
    cor: "#FF9800",      // Laranja
    tipo: "etario",
    faixas: [
      { de: 18, ate: 30, percentual: 0 },
      { de: 31, ate: 35, percentual: 12 },
      { de: 36, ate: 40, percentual: 18 },
      { de: 41, ate: 45, percentual: 25 },
      { de: 46, ate: 50, percentual: 35 },
      { de: 51, ate: 55, percentual: 45 },
      { de: 56, ate: 60, percentual: 60 },
      { de: 61, ate: 65, percentual: 75 },
      { de: 66, ate: 70, percentual: 95 },
      { de: 71, ate: 80, percentual: 100 },
    ]
  },
  {
    id: "icatu",
    nome: "Icatu",
    cor: "#AB47BC",      // Roxo
    tipo: "etario",
    faixas: [
      { de: 18, ate: 30, percentual: 0 },
      { de: 31, ate: 35, percentual: 9 },
      { de: 36, ate: 40, percentual: 14 },
      { de: 41, ate: 45, percentual: 22 },
      { de: 46, ate: 50, percentual: 32 },
      { de: 51, ate: 55, percentual: 42 },
      { de: 56, ate: 60, percentual: 55 },
      { de: 61, ate: 65, percentual: 70 },
      { de: 66, ate: 70, percentual: 88 },
      { de: 71, ate: 80, percentual: 100 },
    ]
  },
  {
    id: "tokio_marine",
    nome: "Tokio Marine",
    cor: "#F44336",      // Vermelho escuro
    tipo: "etario",
    faixas: [
      { de: 18, ate: 30, percentual: 0 },
      { de: 31, ate: 35, percentual: 11 },
      { de: 36, ate: 40, percentual: 16 },
      { de: 41, ate: 45, percentual: 24 },
      { de: 46, ate: 50, percentual: 33 },
      { de: 51, ate: 55, percentual: 44 },
      { de: 56, ate: 60, percentual: 58 },
      { de: 61, ate: 65, percentual: 72 },
      { de: 66, ate: 70, percentual: 92 },
      { de: 71, ate: 80, percentual: 100 },
    ]
  }
];

/**
 * Retorna o percentual de reenquadramento para uma idade e seguradora
 */
function getPercentualFaixa(seguradora, idade) {
  if (seguradora.tipo === "ipca") return 0;
  
  for (const faixa of seguradora.faixas) {
    if (idade >= faixa.de && idade <= faixa.ate) {
      return faixa.percentual;
    }
  }
  // Se passou das faixas, usa o último percentual
  const ultima = seguradora.faixas[seguradora.faixas.length - 1];
  return ultima ? ultima.percentual : 0;
}

/**
 * Verifica se houve mudança de faixa etária entre duas idades
 */
function mudouDeFaixa(seguradora, idadeAnterior, idadeAtual) {
  if (seguradora.tipo === "ipca") return false;
  
  const faixaAnterior = seguradora.faixas.find(f => idadeAnterior >= f.de && idadeAnterior <= f.ate);
  const faixaAtual = seguradora.faixas.find(f => idadeAtual >= f.de && idadeAtual <= f.ate);
  
  if (!faixaAnterior || !faixaAtual) return false;
  return faixaAnterior.de !== faixaAtual.de;
}

/**
 * Calcula a projeção de valores para todas as seguradoras
 * @param {number} idadeInicial - Idade atual do segurado
 * @param {string} sexo - "masculino", "feminino" ou "ambos"
 * @param {number} valorInicial - Valor atual da cobertura de morte
 * @param {number} ipca - IPCA acumulado 12 meses em %
 * @returns {Object} Projeções por seguradora e dados para gráfico
 */
export function calcularProjecao(idadeInicial, sexo, valorInicial, ipca) {
  const anosProjecao = Math.min(80 - idadeInicial, 30); // Projeta até 80 anos ou 30 anos
  const fatorIPCA = 1 + (ipca / 100);

  const dados = []; // Array de pontos para o gráfico: { idade, ano, [segId]: valor }

  // Inicializar valores por seguradora
  const valoresAtuais = {};
  SEGURADORAS.forEach(seg => {
    valoresAtuais[seg.id] = valorInicial;
  });

  // Ponto inicial
  const pontoInicial = { idade: idadeInicial, ano: 0 };
  SEGURADORAS.forEach(seg => {
    pontoInicial[seg.id] = valorInicial;
  });
  dados.push(pontoInicial);

  // Calcular ano a ano
  for (let ano = 1; ano <= anosProjecao; ano++) {
    const idadeAtual = idadeInicial + ano;
    const ponto = { idade: idadeAtual, ano };

    SEGURADORAS.forEach(seg => {
      let valorAnterior = valoresAtuais[seg.id];

      if (seg.tipo === "ipca") {
        // MetLife: apenas IPCA
        valoresAtuais[seg.id] = valorAnterior * fatorIPCA;
      } else {
        // Outras: IPCA + reenquadramento etário se mudou de faixa
        let novoValor = valorAnterior * fatorIPCA;

        if (mudouDeFaixa(seg, idadeAtual - 1, idadeAtual)) {
          const percentualFaixa = getPercentualFaixa(seg, idadeAtual);
          novoValor = novoValor * (1 + percentualFaixa / 100);
        }

        valoresAtuais[seg.id] = novoValor;
      }

      ponto[seg.id] = Math.round(valoresAtuais[seg.id] * 100) / 100;
    });

    dados.push(ponto);
  }

  return {
    dados,
    seguradoras: SEGURADORAS,
    idadeInicial,
    valorInicial,
    ipca,
    anosProjecao
  };
}