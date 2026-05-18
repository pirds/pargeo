// Geometria
export function calcularGeometria(tipo, dimensao) {
  if (tipo === 'circular') {
    const D = dimensao / 1000;
    return {
      perimetro: Math.PI * D,
      areaPonta: Math.PI * D * D / 4
    };
  } else {
    const L = dimensao / 1000;
    return {
      perimetro: 4 * L,
      areaPonta: L * L
    };
  }
}

// Utilitário: encontra camadas laterais e ponta
function prepararCamadas(camadas, comprimento) {
  const validas = camadas
    .filter(c => c.spt > 0 && c.cota <= comprimento)
    .sort((a, b) => a.cota - b.cota);
  if (validas.length < 2) return null;
  const ponta = validas[validas.length - 1];
  const laterais = validas.slice(0, -1);
  return { laterais, ponta, validas };
}

// MÉTODO 1 — P.P.C. Velloso
export function calcularVelloso(camadas, comprimento, geometria) {
  const prep = prepararCamadas(camadas, comprimento);
  if (!prep) return null;
  const { laterais, ponta, validas } = prep;
  const { perimetro, areaPonta } = geometria;

  const Ci = { ARG:0.85, ARGS:0.85, ARGA:0.60, SAG:0.60, SAR:0.50, AREA:0.50, ARS:0.50, ARE:0.50, ARP:0.50 };
  const Cp = { ARG:1.00, ARGS:1.00, ARGA:1.00, SAG:0.90, SAR:0.80, AREA:0.80, ARS:0.70, ARE:0.70, ARP:0.70 };

  let RL = 0;
  for (let i = 0; i < laterais.length; i++) {
    const c = laterais[i];
    const prox = validas[i + 1];
    const deltaZ = prox.cota - c.cota;
    const spt = Math.min(c.spt, 40);
    const ci = Ci[c.tipo] ?? 0.50;
    RL += ci * spt * perimetro * deltaZ;
  }

  const sptPonta = Math.min(ponta.spt, 40);
  const cp = Cp[ponta.tipo] ?? 0.70;
  const RP = cp * sptPonta * areaPonta;

  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// MÉTODO 2 — Aoki-Velloso
export function calcularAoki(camadas, comprimento, geometria) {
  const prep = prepararCamadas(camadas, comprimento);
  if (!prep) return null;
  const { laterais, ponta, validas } = prep;
  const { perimetro, areaPonta } = geometria;

  const F1 = 2, F2 = 4;
  const alphaK = { ARG:0.85, ARGS:0.85, ARGA:0.85, SAG:0.60, SAR:0.60, AREA:0.50, ARS:0.50, ARE:1.40, ARP:1.40 };
  const alphaKPonta = { ARG:0.85, ARGS:0.85, ARGA:0.85, SAG:0.60, SAR:0.60, AREA:0.50, ARS:0.50, ARE:0.84, ARP:0.84 };

  let RL = 0;
  for (let i = 0; i < laterais.length; i++) {
    const c = laterais[i];
    const prox = validas[i + 1];
    const deltaZ = prox.cota - c.cota;
    const ak = alphaK[c.tipo] ?? 0.50;
    RL += (ak * c.spt / F2) * perimetro * deltaZ;
  }

  const ak = alphaKPonta[ponta.tipo] ?? 0.50;
  const RP = (ak * ponta.spt / F1) * areaPonta;

  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// MÉTODO 3 — Décourt-Quaresma
export function calcularDecourt(camadas, comprimento, geometria) {
  const prep = prepararCamadas(camadas, comprimento);
  if (!prep) return null;
  const { laterais, ponta, validas } = prep;
  const { perimetro, areaPonta } = geometria;

  const beta = { ARG:0.85, ARGS:0.85, ARGA:0.85, SAG:0.60, SAR:0.60, AREA:0.50, ARS:0.50, ARE:0.50, ARP:0.50 };
  const alpha = { ARG:1.0, ARGS:1.0, ARGA:1.0, SAG:1.0, SAR:1.0, AREA:1.0, ARS:1.0, ARE:1.0, ARP:1.0 };
  const alphaP = { ARG:168.3, ARGS:168.3, ARGA:168.3, SAG:120.0, SAR:120.0, AREA:100.0, ARS:100.0, ARE:100.0, ARP:100.0 };

  let RL = 0;
  for (let i = 0; i < laterais.length; i++) {
    const c = laterais[i];
    const prox = validas[i + 1];
    const deltaZ = prox.cota - c.cota;
    const spt = Math.max(3, Math.min(c.spt, 50));
    const b = beta[c.tipo] ?? 0.50;
    const a = alpha[c.tipo] ?? 1.0;
    RL += ((b / 3) * spt + a) * perimetro * deltaZ;
  }

  const sptPonta = Math.max(3, Math.min(ponta.spt, 50));
  const ap = alphaP[ponta.tipo] ?? 100.0;
  const RP = ap * sptPonta * areaPonta / 1000;

  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// MÉTODO 4 — A.H. Teixeira
export function calcularTeixeira(camadas, comprimento, geometria) {
  const prep = prepararCamadas(camadas, comprimento);
  if (!prep) return null;
  const { laterais, ponta, validas } = prep;
  const { perimetro, areaPonta } = geometria;

  const beta = 0.4;
  const alphaP = { ARG:11, ARGS:11, ARGA:21, SAG:16, SAR:26, AREA:30, ARS:36, ARE:40, ARP:44 };

  let RL = 0;
  for (let i = 0; i < laterais.length; i++) {
    const c = laterais[i];
    const prox = validas[i + 1];
    const deltaZ = prox.cota - c.cota;
    const spt = Math.min(c.spt, 40);
    RL += beta * spt * perimetro * deltaZ;
  }

  const ap = alphaP[ponta.tipo] ?? 40;
  const RP = ap * Math.min(ponta.spt, 40) * areaPonta;

  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// MÉTODO 5 — U.R. Alonso
export function calcularAlonso(camadas, comprimento, geometria) {
  const prep = prepararCamadas(camadas, comprimento);
  if (!prep) return null;
  const { laterais, ponta, validas } = prep;
  const { perimetro, areaPonta } = geometria;

  const coefLat = { ARG:10, ARGS:10, ARGA:10, SAG:15, SAR:15, AREA:20, ARS:20, ARE:20, ARP:20 };
  const alphaP =  { ARG:0.67, ARGS:0.67, ARGA:0.65, SAG:0.56, SAR:0.59, AREA:0.65, ARS:0.65, ARE:0.65, ARP:0.65 };

  let RL = 0;
  for (let i = 0; i < laterais.length; i++) {
    const c = laterais[i];
    const prox = validas[i + 1];
    const deltaZ = prox.cota - c.cota;
    const spt = Math.min(c.spt, 40);
    const cl = coefLat[c.tipo] ?? 20;
    RL += (cl / 1000) * spt * perimetro * deltaZ;
  }

  const ap = alphaP[ponta.tipo] ?? 0.65;
  const RP = ap * Math.min(ponta.spt, 40) * areaPonta;

  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// CALCULAR TODOS
export function calcularTodos(camadas, comprimento, tipoSecao, dimensao) {
  const geometria = calcularGeometria(tipoSecao, dimensao);
  return {
    geometria,
    velloso:  calcularVelloso(camadas, comprimento, geometria),
    aoki:     calcularAoki(camadas, comprimento, geometria),
    decourt:  calcularDecourt(camadas, comprimento, geometria),
    teixeira: calcularTeixeira(camadas, comprimento, geometria),
    alonso:   calcularAlonso(camadas, comprimento, geometria),
  };
}
