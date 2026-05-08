/**
 * Tabelas de reenquadramento etário por seguradora — dados reais extraídos das condições gerais.
 * 
 * TIPOS DE TABELA:
 * - "ipca": Apenas IPCA (MetLife)
 * - "anual_por_idade": Percentual anual aplicado a cada aniversário conforme a idade (Azos, Bradesco, Tokio Marine)
 * - "faixa": Percentual por faixa etária (Banco do Brasil)
 * - "fator": Fator multiplicador anual conforme a idade (Mongeral Aegon)
 * - "anual_porto": Porto Seguro — percentual por idade, tabela separada para cada faixa
 */

export const SEGURADORAS = [
  {
    id: "metlife",
    nome: "MetLife",
    cor: "#00A651",
    destaque: true,
    tipo: "ipca",
  },
  {
    id: "azos",
    nome: "Azos",
    cor: "#E53935",
    tipo: "anual_por_idade",
    separaPorSexo: true,
    // Tabela da Azos — percentual anual por idade e sexo
    tabela: {
      masculino: {18:0,19:19.40,20:8.40,21:0.10,22:0,23:0,24:0,25:0,26:0,27:0,28:0,29:1.30,30:1.60,31:2.10,32:2.50,33:3.60,34:2.80,35:3.00,36:4.10,37:6.70,38:4.40,39:3.90,40:5.40,41:7.00,42:8.40,43:6.50,44:7.10,45:7.00,46:7.90,47:8.40,48:10.00,49:8.40,50:11.80,51:11.30,52:11.50,53:10.80,54:7.80,55:9.90,56:8.40,57:9.50,58:7.20,59:10.40,60:9.00,61:9.20,62:7.10,63:8.40,64:8.90,65:7.80,66:7.70,67:6.40,68:8.70,69:7.40,70:9.40,71:10.40,72:11.90,73:12.00,74:10.40,75:6.90,76:9.40,77:9.70,78:11.20,79:7.70,80:11.50,81:10.30,82:11.00,83:8.80,84:8.90,85:11.40,86:9.60,87:11.20,88:8.00,89:11.00,90:6.70,91:6.40,92:8.10,93:8.10,94:8.10,95:8.10,96:8.10,97:8.10,98:8.10,99:8.10,100:8.10},
      feminino: {18:0,19:25.00,20:17.90,21:10.50,22:6.60,23:2.70,24:0,25:0,26:1.90,27:3.30,28:5.10,29:5.20,30:5.60,31:5.40,32:5.90,33:7.00,34:7.30,35:7.50,36:6.10,37:6.40,38:6.60,39:8.00,40:9.10,41:10.60,42:9.80,43:9.10,44:7.90,45:8.10,46:8.30,47:9.90,48:10.10,49:10.10,50:8.90,51:8.60,52:7.40,53:7.40,54:8.00,55:9.10,56:9.30,57:9.30,58:9.30,59:9.30,60:9.40,61:9.00,62:8.90,63:8.00,64:8.00,65:7.20,66:7.70,67:7.60,68:8.30,69:8.20,70:8.70,71:8.30,72:9.00,73:8.60,74:11.20,75:10.90,76:11.50,77:9.80,78:11.20,79:11.30,80:12.60,81:12.70,82:13.20,83:12.50,84:11.70,85:12.50,86:12.20,87:11.40,88:10.10,89:10.90,90:11.40,91:10.80,92:11.50,93:12.40,94:10.60,95:11.20,96:11.30,97:10.50,98:9.60,99:9.80,100:7.90},
    }
  },
  {
    id: "banco_brasil",
    nome: "Banco do Brasil",
    cor: "#FFCA28",
    tipo: "faixa",
    // BB Seguros — percentual por faixa etária (aplicado anualmente dentro da faixa)
    faixas: [
      { de: 18, ate: 34, percentual: 5.15 },
      { de: 35, ate: 44, percentual: 9.45 },
      { de: 45, ate: 54, percentual: 11.55 },
      { de: 55, ate: 64, percentual: 8.05 },
      { de: 65, ate: 200, percentual: 8.90 },
    ]
  },
  {
    id: "bradesco",
    nome: "Bradesco",
    cor: "#E91E63",
    tipo: "anual_por_idade",
    separaPorSexo: false,
    // Bradesco — coluna "Morte" do PDF (tabela única, sem separação por sexo)
    tabela: {
      ambos: {18:0,19:4.97,20:5.08,21:4.94,22:5.06,23:5.03,24:5.04,25:2.52,26:2.51,27:2.42,28:2.63,29:2.51,30:3.49,31:3.59,32:3.50,33:3.44,34:3.56,35:3.52,36:4.45,37:4.67,38:4.47,39:4.57,40:4.45,41:9.07,42:9.11,43:8.91,44:8.98,45:9.02,46:9.01,47:8.97,48:8.90,49:8.99,50:10.05,51:10.01,52:10.06,53:9.96,54:10.14,55:10.02,56:9.90,57:10.07,58:10.09,59:9.95,60:10.11,61:9.06,62:8.93,63:9.08,64:8.94,65:9.10,66:8.95,67:8.95,68:9.10,69:9.11,70:8.97,71:9.11,72:8.96,73:8.96,74:9.10,75:9.09,76:9.08,77:8.94,78:9.07,79:8.93,80:9.06,81:9.46,82:9.45,83:9.44,84:9.42,85:9.40,86:9.37,87:9.35,88:9.32,89:9.29,90:9.26}
    }
  },
  {
    id: "porto_seguro",
    nome: "Porto Seguro",
    cor: "#FF9800",
    tipo: "anual_por_idade",
    separaPorSexo: true,
    // Porto Seguro — percentuais por idade e sexo
    tabela: {
      feminino: {17:2.80,18:3.00,19:3.50,20:3.60,21:3.80,22:3.90,23:4.40,24:4.60,25:4.40,26:4.50,27:4.20,28:4.00,29:3.90,30:3.70,31:3.60,32:3.60,33:3.60,34:3.90,35:-6.60,36:7.40,37:7.80,38:8.60,39:9.10,40:5.00,41:15.40,42:10.80,43:11.70,44:10.60,45:12.20,46:29.10,47:11.70,48:11.10,49:10.50,50:9.80,51:9.20,52:8.60,53:8.00,54:7.60,55:7.20,56:6.90,57:6.70,58:6.60,59:6.70,60:7.20,61:7.70,62:8.40,63:9.10,64:9.70,65:10.20,66:10.50,67:10.70,68:10.80,69:10.80,70:10.80},
      masculino: {17:2.60,18:3.10,19:3.40,20:3.50,21:3.90,22:4.10,23:4.20,24:4.70,25:4.30,26:4.40,27:4.10,28:4.00,29:3.90,30:3.80,31:3.50,32:3.60,33:3.50,34:3.90,35:-6.50,36:7.20,37:7.90,38:8.50,39:9.20,40:4.90,41:15.50,42:10.80,43:11.60,44:10.70,45:12.10,46:29.10,47:11.70,48:11.10,49:10.50,50:9.80,51:9.20,52:8.60,53:8.00,54:7.60,55:7.20,56:6.90,57:6.70,58:6.60,59:6.70,60:7.10,61:7.70,62:8.40,63:9.10,64:9.70,65:10.20,66:10.50,67:10.70,68:10.80,69:10.80,70:10.80},
    }
  },
  {
    id: "tokio_marine",
    nome: "Tokio Marine",
    cor: "#1E88E5",
    tipo: "anual_por_idade",
    separaPorSexo: true,
    // Tokio Marine — condições especiais (páginas 7-9 do PDF). Percentuais são variação % anual.
    tabela: {
      masculino: {18:0,19:3.41,20:3.47,21:3.97,22:4.00,23:4.40,24:4.57,25:4.35,26:4.51,27:3.99,28:3.57,29:3.57,30:3.56,31:3.56,32:3.55,33:3.56,34:3.91,35:4.68,36:5.56,37:6.61,38:7.94,39:9.16,40:10.28,41:11.26,42:12.14,43:12.73,44:12.88,45:12.68,46:12.25,47:11.73,48:11.10,49:10.50,50:9.83,51:8.60,52:8.49,53:8.02,54:7.57,55:7.21,56:6.93,57:6.71,58:6.59,59:6.75,60:7.14,61:7.74,62:8.43,63:9.14,64:9.73,65:10.18,66:10.49,67:10.70,68:10.81,69:10.75,70:10.75,71:10.65,72:10.50,73:10.35,74:10.27,75:10.23,76:10.29,77:10.24,78:10.25,79:10.23,80:10.18,81:10.10,82:10.02,83:9.89,84:9.55,85:9.32,86:8.94,87:8.53,88:8.12,89:7.80,90:7.57,91:7.40},
      feminino: {18:0,19:6.55,20:6.59,21:6.14,22:6.17,23:6.14,24:6.10,25:5.74,26:5.47,27:5.15,28:4.65,29:4.44,30:4.26,31:4.30,32:4.15,33:4.16,34:4.43,35:4.61,36:5.31,37:5.75,38:6.43,39:6.97,40:7.38,41:7.95,42:8.30,43:8.66,44:8.92,45:9.36,46:9.71,47:10.16,48:10.54,49:10.53,50:10.44,51:10.16,52:9.87,53:9.53,54:9.23,55:9.07,56:8.99,57:8.92,58:8.94,59:9.15,60:9.46,61:9.67,62:10.29,63:10.66,64:10.73,65:10.60,66:10.28,67:9.86,68:9.47,69:9.47,70:9.80,71:10.33,72:10.96,73:10.95,74:10.07,75:12.07,76:12.38,77:12.60,78:12.58,79:12.57,80:12.58,81:12.58,82:12.56,83:12.51,84:12.42,85:12.31,86:12.17,87:12.01,88:11.78,89:11.39,90:10.84,91:10.23}
    }
  },
  {
    id: "mongeral",
    nome: "Mongeral Aegon",
    cor: "#AB47BC",
    tipo: "fator",
    separaPorSexo: false,
    // Mongeral — fator multiplicador anual (ex: 1.0430 = +4.30% de aumento)
    fator: {16:1,17:1.0517,18:1.0430,19:1.0299,20:1.0455,21:1.0393,22:1.0330,23:1.0318,24:1.0265,25:1.0106,26:1.0157,27:1.0149,28:1.0203,29:1.0243,30:1.0360,31:1.0150,32:1.0347,33:1.0379,34:1.0418,35:1.0528,36:1.0272,37:1.0131,38:1.0859,39:1.0939,40:1.0995,41:1.0882,42:1.0858,43:1.0988,44:1.0988,45:1.0997,46:1.1142,47:1.1266,48:1.1226,49:1.1251,50:1.1246,51:1.1008,52:1.1064,53:1.1063,54:1.1057,55:1.1052,56:1.1280,57:1.1269,58:1.1264,59:1.1186,60:1.1249,61:1.1189,62:1.1163,63:1.1044,64:1.1042,65:1.1045,66:1.1052,67:1.0950,68:1.0957,69:1.0943,70:1.0916,71:1.0876,72:1.0831,73:1.0786,74:1.0768,75:1.0771,76:1.0792,77:1.0823,78:1.0859,79:1.0874,80:1.0869,81:1.2056,82:1.0827,83:1.0790,84:1.0762,85:1.0742,86:1.0725,87:1.0712,88:1.0709,89:1.0717,90:1.0738,91:1.0773,92:1.0820,93:1.0879,94:1.0946,95:1.1092,96:1.1404,97:1.2193,98:1.3680,99:1.4964}
  }
];

/**
 * Retorna o percentual de reenquadramento anual para uma idade, seguradora e sexo
 */
function getPercentualAnual(seguradora, idade, sexo) {
  if (seguradora.tipo === "ipca") return 0;

  if (seguradora.tipo === "faixa") {
    for (const faixa of seguradora.faixas) {
      if (idade >= faixa.de && idade <= faixa.ate) return faixa.percentual;
    }
    const ultima = seguradora.faixas[seguradora.faixas.length - 1];
    return ultima?.percentual || 0;
  }

  if (seguradora.tipo === "fator") {
    const fator = seguradora.fator[idade];
    if (fator) return (fator - 1) * 100; // Converte fator para percentual
    // Se não tem a idade, pega o mais próximo
    const idades = Object.keys(seguradora.fator).map(Number).sort((a, b) => a - b);
    const maisProxima = idades.reduce((prev, curr) => Math.abs(curr - idade) < Math.abs(prev - idade) ? curr : prev);
    return (seguradora.fator[maisProxima] - 1) * 100;
  }

  if (seguradora.tipo === "anual_por_idade") {
    const tab = seguradora.tabela;
    let chave = "ambos";
    if (seguradora.separaPorSexo && sexo !== "ambos") {
      chave = sexo;
    } else if (seguradora.separaPorSexo) {
      // Se seguradora separa mas user escolheu "ambos", usa média dos dois
      const m = tab.masculino?.[idade] ?? 0;
      const f = tab.feminino?.[idade] ?? 0;
      return (m + f) / 2;
    }
    const tabSexo = tab[chave];
    if (!tabSexo) return 0;
    if (tabSexo[idade] !== undefined) return tabSexo[idade];
    // Pega a idade mais próxima disponível
    const idades = Object.keys(tabSexo).map(Number).sort((a, b) => a - b);
    if (idade > idades[idades.length - 1]) return tabSexo[idades[idades.length - 1]];
    if (idade < idades[0]) return 0;
    const maisProxima = idades.reduce((prev, curr) => Math.abs(curr - idade) < Math.abs(prev - idade) ? curr : prev);
    return tabSexo[maisProxima] ?? 0;
  }

  return 0;
}

/**
 * Calcula a projeção de valores para todas as seguradoras
 */
export function calcularProjecao(idadeInicial, sexo, valorInicial, ipca) {
  const anosProjecao = Math.min(80 - idadeInicial, 30);
  const fatorIPCA = 1 + (ipca / 100);

  const dados = [];
  const valoresAtuais = {};
  SEGURADORAS.forEach(seg => { valoresAtuais[seg.id] = valorInicial; });

  // Ponto inicial
  const p0 = { idade: idadeInicial, ano: 0 };
  SEGURADORAS.forEach(seg => { p0[seg.id] = valorInicial; });
  dados.push(p0);

  for (let ano = 1; ano <= anosProjecao; ano++) {
    const idadeAtual = idadeInicial + ano;
    const ponto = { idade: idadeAtual, ano };

    SEGURADORAS.forEach(seg => {
      const valorAnterior = valoresAtuais[seg.id];

      if (seg.tipo === "ipca") {
        // MetLife: apenas IPCA
        valoresAtuais[seg.id] = valorAnterior * fatorIPCA;
      } else {
        // Todas as outras: IPCA + reenquadramento etário anual
        const percentual = getPercentualAnual(seg, idadeAtual, sexo);
        const fatorReenquadramento = 1 + (percentual / 100);
        valoresAtuais[seg.id] = valorAnterior * fatorIPCA * fatorReenquadramento;
      }

      ponto[seg.id] = Math.round(valoresAtuais[seg.id] * 100) / 100;
    });

    dados.push(ponto);
  }

  return { dados, seguradoras: SEGURADORAS, idadeInicial, valorInicial, ipca, anosProjecao };
}