// ============================================================
// CÁLCULO DE CAPACIDADE DE CARGA DE ESTACAS — 5 Métodos SPT
// Fórmulas extraídas e validadas célula por célula da planilha Excel
// Valores de referência (φ450mm, L=10m):
//   Velloso  RL=53.22 RP=32.89 Qadm=43.06 tf ✓
//   Aoki     RL=33.52 RP=50.10 Qadm=41.81 tf ✓
//   Décourt  RL=46.08 RP=32.17 Qadm=39.13 tf ✓
//   Teixeira RL=46.94 RP=13.12 Qadm=30.03 tf ✓
//   Alonso   RL=48.67 RP=28.03 Qadm=38.35 tf ✓
// ============================================================

export function calcularGeometria(tipoSecao, dimensao) {
  if (tipoSecao === 'circular') {
    const D = dimensao / 1000;
    return { perimetro: Math.PI * D, areaPonta: Math.PI * D * D / 4, diametro: D };
  } else {
    const L = dimensao / 1000;
    return { perimetro: 4 * L, areaPonta: L * L, diametro: L };
  }
}

// Velloso Ci lateral por tipo
const CI = { ARGS:0.63, ARGA:0.63, SAG:0.70, SAR:0.80, AREA:0.85, ARS:0.85, ARE:0.50, ARP:0.50, ARG:0.85 };
// Velloso Cp ponta por tipo
const CP_V = { ARGS:25, ARGA:25, SAG:30, SAR:40, AREA:45, ARS:50, ARE:60, ARP:60, ARG:25 };
// Aoki αK lateral
const AOKI_AK_LAT = { ARGS:0.88, ARGA:0.88, SAG:0.88, SAR:0.88, AREA:0.88, ARS:0.88, ARE:1.40, ARP:1.40, ARG:0.88 };
// Aoki K ponta (DZ — sem α)
const AOKI_K_PONT = { ARG:22, ARGS:60, ARGA:35, SAG:23, SAR:55, AREA:60, ARS:80, ARE:100, ARP:100 };
// Décourt coef lateral (1/3·β)
const DQ_COEF_LAT = { ARG:0.40, ARGS:0.40, ARGA:0.389, SAG:0.333, SAR:0.333, AREA:0.333, ARS:0.333, ARE:0.333, ARP:0.333 };
// Décourt αK acima da ponta (=0 para ARE/ARP/AREA/ARS verificado na planilha)
const DQ_AK_ACIMA = { ARG:9.35, ARGS:0, ARGA:9.35, SAG:9.35, SAR:9.35, AREA:0, ARS:0, ARE:0, ARP:0 };
// Décourt αK ponta+abaixo
const DQ_AK_ABAIXO = { ARG:10.2, ARGS:10.2, ARGA:10.2, SAG:10.2, SAR:10.2, AREA:0, ARS:0, ARE:0, ARP:0 };
// Alonso α ponta
const ALONSO_ALPHA = { ARG:0.67, ARGS:0.67, ARGA:0.65, SAG:0.56, SAR:0.59, AREA:0.65, ARS:0.65, ARE:0.65, ARP:0.65 };
// Alonso K lateral (CR/CX por tipo)
const ALONSO_K = { ARG:10, ARGS:10, ARGA:10, SAG:10, SAR:10, AREA:10, ARS:10, ARE:20, ARP:20 };

// ============================================================
// MÉTODO 1 — P.P.C. Velloso
// CX27 = AC12(0.85) × lambdaI × perimetro × CK65
// CX28 = AD12(0.5) × lambdaP × CX24 × areaPonta × 0.5 × (CL65+CP65)
// CK65 = Σ CI[tipo] × min(SPT,40) para laterais (CC>0)
// CL65 = Σ CP[tipo]×SPT / CZ25, camadas CC=1..CZ25
// CP65 = Σ CP[tipo]×SPT / CZ26, ponta (CC=0) + 1ª abaixo
// CZ25 = ROUND(8×db,0); CZ26 = ROUND(3.5×db,0)
// CX24 = 1.016 - 0.016×(db×100/3.6)
// ============================================================
export function calcularVelloso(camadas, comprimento, geometria, tipoCarregamento) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const lambdaI = tipoCarregamento === 'tracao' ? 0 : 1;
  const lambdaP = tipoCarregamento === 'tracao' ? 0 : 1;
  const CZ25 = Math.max(1, Math.round(8 * db));
  const CZ26 = Math.max(1, Math.round(3.5 * db));
  const CX24 = 1.016 - 0.016 * (db * 100 / 3.6);

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  const abaixo = ord.filter(c => c.cota > comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];

  let CK65 = 0;
  for (const c of lat) CK65 += (CI[c.tipo] ?? 0.50) * Math.min(c.spt, 40);
  const RL = 0.85 * lambdaI * perimetro * CK65;

  const acimaJanela = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let somaCL = 0;
  for (const c of acimaJanela) somaCL += (CP_V[c.tipo] ?? 25) * Math.min(c.spt, 40);
  const CL65 = somaCL / Math.max(acimaJanela.length, 1);

  const pontaEAbaixo = [ponta, ...abaixo.slice(0, CZ26 - 1)];
  let somaCP = 0;
  for (const c of pontaEAbaixo) somaCP += (CP_V[c.tipo] ?? 25) * Math.min(c.spt, 40);
  const CP65 = somaCP / CZ26;

  const RP = 0.5 * lambdaP * CX24 * areaPonta * 0.5 * (CL65 + CP65);
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 2 — Aoki-Velloso
// EF15 = perimetro/F2 × EB65  (F2=4)
// EF16 = areaPonta/F1 × EC65  (F1=2)
// EB65 = Σ αK_lat × SPT para laterais
// EC65 = K_ponta × SPT_ponta (somente a ponta, CC=0, sem α)
// ============================================================
export function calcularAoki(camadas, comprimento, geometria) {
  const { perimetro, areaPonta } = geometria;

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];

  let EB65 = 0;
  for (const c of lat) EB65 += (AOKI_AK_LAT[c.tipo] ?? 0.88) * c.spt;
  const EC65 = (AOKI_K_PONT[ponta.tipo] ?? 35) * ponta.spt;

  const RL = (perimetro / 4) * EB65;
  const RP = (areaPonta / 2) * EC65;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 3 — Décourt-Quaresma
// HJ15 = (FU65 × L × perimetro) / n_laterais
// HJ16 = (HF65 / 3) × areaPonta
// FU65 = Σ DQ_COEF × max(3,min(SPT,50)) para laterais
// HF65 = Σ αK_acima × SPT (CC=1..CZ25) + Σ αK_abaixo × SPT (ponta + 2 abaixo)
// ============================================================
export function calcularDecourt(camadas, comprimento, geometria) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const CZ25 = Math.max(1, Math.round(8 * db));

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  const abaixo = ord.filter(c => c.cota > comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];
  const nLat = Math.max(lat.length, 1);

  let FU65 = 0;
  for (const c of lat) FU65 += (DQ_COEF_LAT[c.tipo] ?? 0.333) * Math.max(3, Math.min(c.spt, 50));

  const acimaJanela = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let HF65 = 0;
  for (const c of acimaJanela) HF65 += (DQ_AK_ACIMA[c.tipo] ?? 0) * Math.max(3, Math.min(c.spt, 50));
  const pontaEAbaixo = [ponta, ...abaixo.slice(0, 2)];
  for (const c of pontaEAbaixo) HF65 += (DQ_AK_ABAIXO[c.tipo] ?? 0) * Math.max(3, Math.min(c.spt, 50));

  const RL = (FU65 * comprimento * perimetro) / nLat;
  const RP = (HF65 / 3) * areaPonta;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 4 — A.H. Teixeira
// II70 = HN65 × perimetro × 0.4
// II71 = areaPonta × 0.5 × IN68
// HN65 = Σ max(SPT,4) para laterais
// IN66 = Σ SPT×10 para CC=1..HO  (HO=ROUND(db×4,0))
// IN67 = IN66/HO; IW67=0; IN68=IN67+IW67
// ============================================================
export function calcularTeixeira(camadas, comprimento, geometria) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const HO = Math.max(1, Math.round(db * 4));

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  const abaixo = ord.filter(c => c.cota > comprimento);
  if (atePonta.length === 0) return null;

  let HN65 = 0;
  for (const c of lat) HN65 += Math.max(c.spt, 4);

  const acimaIN = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= HO; });
  let IN66 = 0;
  for (const c of acimaIN) IN66 += c.spt * 10;
  const IN67 = IN66 / HO;

  // IW: camadas abaixo dentro de 1×db
  const zonaAbaixo = abaixo.filter(c => c.cota <= comprimento + db);
  let IW66 = 0;
  for (const c of zonaAbaixo.slice(0, 1)) IW66 += c.spt * 10;
  const IW67 = zonaAbaixo.length > 0 ? IW66 / Math.max(1, zonaAbaixo.length) : 0;

  const IN68 = IN67 + IW67;
  const RL = HN65 * perimetro * 0.4;
  const RP = areaPonta * 0.5 * IN68;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 5 — U.R. Alonso
// DA126 = CM122 × perimetro × CX12 × 0.662
// DA127 = (DH123 + DQ123) × 0.5 × areaPonta
// CM122 = Σ SPT de TODAS as laterais (CC>0)
// DH123 = DG123/n: média K×SPT na janela CC=1..CZ25
// DQ123 = K[ponta] × SPT_ponta (camada da ponta, CC=0)
// ============================================================
export function calcularAlonso(camadas, comprimento, geometria) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const CZ25 = Math.max(1, Math.round(8 * db));

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];

  let CM122 = 0;
  for (const c of lat) CM122 += Math.min(c.spt, 40);

  const CX12 = ALONSO_ALPHA[ponta.tipo] ?? 0.65;

  const acimaJanela = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let DG123 = 0;
  for (const c of acimaJanela) DG123 += (ALONSO_K[c.tipo] ?? 10) * Math.min(c.spt, 40);
  const DH123 = DG123 / Math.max(acimaJanela.length, 1);

  const DQ123 = (ALONSO_K[ponta.tipo] ?? 10) * Math.min(ponta.spt, 40);

  const RL = CM122 * perimetro * CX12 * 0.662;
  const RP = (DH123 + DQ123) * 0.5 * areaPonta;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// CALCULAR TODOS OS MÉTODOS
// ============================================================
export function calcularTodos(camadas, comprimento, tipoSecao, dimensao, tipoCarregamento = 'compressao') {
  const geometria = calcularGeometria(tipoSecao, dimensao);
  const velloso  = calcularVelloso(camadas, comprimento, geometria, tipoCarregamento);
  const aoki     = calcularAoki(camadas, comprimento, geometria);
  const decourt  = calcularDecourt(camadas, comprimento, geometria);
  const teixeira = calcularTeixeira(camadas, comprimento, geometria);
  const alonso   = calcularAlonso(camadas, comprimento, geometria);

  const metodos = [velloso, aoki, decourt, teixeira, alonso].filter(Boolean);
  const media = metodos.length > 0 ? {
    RL:   metodos.reduce((s, m) => s + m.RL,   0) / metodos.length,
    RP:   metodos.reduce((s, m) => s + m.RP,   0) / metodos.length,
    Q:    metodos.reduce((s, m) => s + m.Q,    0) / metodos.length,
    Qadm: metodos.reduce((s, m) => s + m.Qadm, 0) / metodos.length,
  } : null;

  return { geometria, velloso, aoki, decourt, teixeira, alonso, media };
}
