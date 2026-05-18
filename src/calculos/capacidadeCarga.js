// ============================================================
// CÁLCULO DE CAPACIDADE DE CARGA DE ESTACAS — 5 Métodos SPT
// Fórmulas extraídas e validadas célula por célula da planilha
// Perfil validação: cotas 1-7=ARE, cota8=ARG, cota9=ARGA,
//   cota10(ponta)=ARGA, cota11+=ARG | φ450mm, L=10m
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

// ============================================================
// TABELAS DE COEFICIENTES (extraídas das fórmulas BL..CA e FM..FT)
// Mapeamento: AG=ARG, AH=ARGA, AI=SAG, AJ=SAR, AK=ARGS, AL=ARS, AM=ARE, AN=ARP
// ============================================================

// Velloso: Ci lateral (BL=AG×0.63, BN=AH×0.63, BP=AI×0.70, BR=AJ×0.80,
//          BT=AK×0.85, BV=AL×0.85, BX=AM×0.50, BZ=AN×0.50)
const CI = { ARG:0.63, ARGA:0.63, SAG:0.70, SAR:0.80, ARGS:0.85, ARS:0.85, ARE:0.50, ARP:0.50 };

// Velloso: Cp ponta (BM=AG×25, BO=AH×25, BQ=AI×30, BS=AJ×40,
//          BU=AK×45, BW=AL×50, BY=AM×60, CA=AN×60)
const CP_V = { ARG:25, ARGA:25, SAG:30, SAR:40, ARGS:45, ARS:50, ARE:60, ARP:60 };

// Aoki: αK lateral (EA=DY×N; αK=DY por tipo)
const AOKI_AK_LAT = { ARG:0.88, ARGA:0.88, SAG:0.88, SAR:0.88, ARGS:0.88, ARS:0.88, ARE:1.40, ARP:1.40 };

// Aoki: K ponta (DZ=K sem α; DI=AG×22, DK=AH×35, DM=AI×23, DO=AJ×55,
//       DQ=AK×60, DS=AL×80, DU=AM×100, DW=AN×100)
const AOKI_K_PONT = { ARG:22, ARGA:35, SAG:23, SAR:55, ARGS:60, ARS:80, ARE:100, ARP:100 };

// Décourt: αK lateral (FD=1.0=ARG, FE=1.0=ARGA, FF=1.0=SAG, FG=0.9=SAR,
//          FH=0.8=ARGS, FI=0.8=ARS, FJ=0.7=ARE, FK=0.7=ARP)
const DQ_AK_LAT = { ARG:1.0, ARGA:1.0, SAG:1.0, SAR:0.9, ARGS:0.8, ARS:0.8, ARE:0.7, ARP:0.7 };

// Décourt: αK acima da ponta (GX=EQ×FX×GG×GP; FX=ARGA flag → só ARGA≠0 acima)
const DQ_AK_ACIMA = { ARG:0, ARGA:9.35, SAG:9.35, SAR:9.35, ARGS:0, ARS:0, ARE:0, ARP:0 };

// Décourt: αK ponta + abaixo (GX para CC=0, CC=-1, CC=-2)
const DQ_AK_ABAIXO = { ARG:10.2, ARGA:10.2, SAG:10.2, SAR:10.2, ARGS:10.2, ARS:0, ARE:0, ARP:0 };

// Alonso: α ponta (CX12 por tipo)
const ALONSO_ALPHA = { ARG:0.67, ARGA:0.65, SAG:0.56, SAR:0.59, ARGS:0.67, ARS:0.65, ARE:0.65, ARP:0.65 };

// Alonso: K lateral/ponta (CR=ARGS×10, CX=ARE×20, AH=ARGA×10 etc)
const ALONSO_K = { ARG:10, ARGA:10, SAG:10, SAR:10, ARGS:10, ARS:10, ARE:20, ARP:20 };

// ============================================================
// MÉTODO 1 — P.P.C. Velloso
// CX27 = 0.85 × λI × perimetro × CK65
// CX28 = 0.5 × λP × CX24 × areaPonta × 0.5 × (CL65 + CP65)
// CK65 = Σ CI[tipo] × min(SPT,40) — laterais (CC>0)
// CL65 = Σ CP[tipo]×SPT / CZ25 — janela CC=1..CZ25 acima
// CP65 = Σ CP[tipo]×SPT / CZ26 — ponta(CC=0) + 1ª abaixo
// CZ25 = ROUND(8×db,0); CZ26 = ROUND(3.5×db,0)
// CX24 = 1.016 − 0.016×(db×100/3.6)
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

  const janelaCL = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let somaCL = 0;
  for (const c of janelaCL) somaCL += (CP_V[c.tipo] ?? 25) * Math.min(c.spt, 40);
  const CL65 = somaCL / Math.max(janelaCL.length, 1);

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
// EF15 = perimetro/4 × EB65
// EF16 = areaPonta/2 × EC65
// EB65 = Σ αK_lat × SPT — laterais
// EC65 = K_ponta × SPT_ponta (CC=0, sem α)
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
// FU65 = Σ αK × (max(3,min(SPT,50))/3 + 1) — laterais
// HF65 = Σ αK_acima × SPT (CC=1..CZ25) + Σ αK_abaixo × SPT (ponta+2 abaixo)
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

  // FU65: fórmula FM..FT = αK × (SPT_DQ/3 + 1) por camada lateral
  let FU65 = 0;
  for (const c of lat) {
    const ak = DQ_AK_LAT[c.tipo] ?? 0.7;
    const spt_dq = Math.max(3, Math.min(c.spt, 50));
    FU65 += ak * (spt_dq / 3 + 1);
  }

  // HF65: janela acima + ponta + abaixo
  const janelaAcima = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let HF65 = 0;
  for (const c of janelaAcima) HF65 += (DQ_AK_ACIMA[c.tipo] ?? 0) * Math.max(3, Math.min(c.spt, 50));
  for (const c of [ponta, ...abaixo.slice(0, 2)]) HF65 += (DQ_AK_ABAIXO[c.tipo] ?? 0) * Math.max(3, Math.min(c.spt, 50));

  const RL = (FU65 * comprimento * perimetro) / nLat;
  const RP = (HF65 / 3) * areaPonta;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 4 — A.H. Teixeira
// II70 = HN65 × perimetro × 0.4
// II71 = areaPonta × 0.5 × IN68
// HN65 = Σ max(SPT,4) — laterais
// IN66 = Σ SPT×10 para CC=1..HO (HO=ROUND(db×4,0))
// IN67 = IN66/HO; IW67=0; IN68=IN67
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

  const janelaIN = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= HO; });
  let IN66 = 0;
  for (const c of janelaIN) IN66 += c.spt * 10;
  const IN67 = IN66 / HO;

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
// CM122 = Σ min(SPT,40) — todas as laterais
// DH123 = DG123/n: Σ K×SPT na janela CC=1..CZ25
// DQ123 = K[ponta] × SPT_ponta
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

  const janelaAcima = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let DG123 = 0;
  for (const c of janelaAcima) DG123 += (ALONSO_K[c.tipo] ?? 10) * Math.min(c.spt, 40);
  const DH123 = DG123 / Math.max(janelaAcima.length, 1);

  const DQ123 = (ALONSO_K[ponta.tipo] ?? 10) * Math.min(ponta.spt, 40);

  const RL = CM122 * perimetro * CX12 * 0.662;
  const RP = (DH123 + DQ123) * 0.5 * areaPonta;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// CALCULAR TODOS
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
