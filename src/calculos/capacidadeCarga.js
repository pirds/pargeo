// ============================================================
// CÁLCULO DE CAPACIDADE DE CARGA DE ESTACAS — 5 Métodos SPT
// Fatores por tipo de estaca extraídos e validados da planilha
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
// FATORES POR TIPO DE ESTACA
// Fonte: planilha linhas 5-11, colunas AC(αi), BT(β_T), CN(αp_Al), BX(fator_Al)
// Validados contra resultados numéricos da planilha
// ============================================================
export const FATORES_ESTACA = {
  //                      αi_V  αp_V  F1_Ak  F2_Ak  β_T   αp_Al  fat_Al
  franki:          { alpha_i:1.00, alpha_p:0.50, F1:1.5625, F2:3.125, beta:0.40, alphap_Al:0.67, fat_Al:0.662 },
  premoldada:      { alpha_i:1.00, alpha_p:0.50, F1:2.50,   F2:5.00,  beta:0.50, alphap_Al:0.67, fat_Al:0.662 },
  helice_continua: { alpha_i:0.85, alpha_p:0.50, F1:2.00,   F2:4.00,  beta:0.40, alphap_Al:0.65, fat_Al:0.662 },
  escavada_sem_rev:{ alpha_i:0.50, alpha_p:0.50, F1:3.00,   F2:6.00,  beta:0.40, alphap_Al:0.56, fat_Al:0.662 },
  escavada_com_rev:{ alpha_i:0.70, alpha_p:0.50, F1:3.00,   F2:6.00,  beta:0.40, alphap_Al:0.59, fat_Al:0.662 },
  raiz:            { alpha_i:0.90, alpha_p:0.50, F1:2.00,   F2:4.00,  beta:0.60, alphap_Al:0.65, fat_Al:0.884 },
  hollow_auger:    { alpha_i:0.90, alpha_p:0.50, F1:2.00,   F2:4.00,  beta:0.60, alphap_Al:0.87, fat_Al:0.662 },
};

// ============================================================
// αK DÉCOURT-QUARESMA POR TIPO DE SOLO E TIPO DE ESTACA
// Fonte: planilha cols BC,BE,BG,BI,BK,BM,BO linhas 5-11
// FD=αK_ARG, FE=αK_ARGA, FG=αK_SAR, FH=αK_ARGS, FI=αK_ARS, FJ=αK_ARE
// ============================================================
export const DQ_AK_POR_ESTACA = {
  //                       ARG   ARGA  SAG   SAR   ARGS  ARS   ARE   ARP
  franki:          { ARG:1.0, ARGA:1.0, SAG:1.0, SAR:1.0, ARGS:1.0, ARS:1.0, ARE:1.0, ARP:1.0 },
  premoldada:      { ARG:1.0, ARGA:1.0, SAG:1.0, SAR:1.0, ARGS:1.0, ARS:1.0, ARE:1.0, ARP:1.0 },
  helice_continua: { ARG:1.0, ARGA:0.85,SAG:1.0, SAR:0.9, ARGS:0.8, ARS:0.8, ARE:0.7, ARP:0.7 },
  escavada_sem_rev:{ ARG:0.8, ARGA:0.85,SAG:0.8, SAR:0.9, ARGS:0.65,ARS:0.6, ARE:0.5, ARP:0.5 },
  escavada_com_rev:{ ARG:0.9, ARGA:0.85,SAG:0.9, SAR:0.9, ARGS:0.75,ARS:0.6, ARE:0.5, ARP:0.5 },
  raiz:            { ARG:1.0, ARGA:0.9, SAG:1.0, SAR:0.9, ARGS:1.0, ARS:0.9, ARE:1.3, ARP:1.3 },
  hollow_auger:    { ARG:1.5, ARGA:0.85,SAG:1.5, SAR:0.9, ARGS:1.5, ARS:0.6, ARE:0.5, ARP:0.5 },
};

// ============================================================
// TABELAS DE COEFICIENTES POR TIPO DE SOLO
// ============================================================
const CI    = { ARG:0.63, ARGA:0.63, SAG:0.70, SAR:0.80, ARGS:0.85, ARS:0.85, ARE:0.50, ARP:0.50 };
const CP_V  = { ARG:25,   ARGA:25,   SAG:30,   SAR:40,   ARGS:45,   ARS:50,   ARE:60,   ARP:60   };
const AK_LAT= { ARG:0.88, ARGA:0.88, SAG:0.88, SAR:0.88, ARGS:0.88, ARS:0.88, ARE:1.40, ARP:1.40 };
const K_PONT= { ARG:22,   ARGA:35,   SAG:23,   SAR:55,   ARGS:60,   ARS:80,   ARE:100,  ARP:100  };
const DQ_AK_ACIMA  = { ARG:0, ARGA:9.35, SAG:9.35, SAR:9.35, ARGS:0,   ARS:0, ARE:0, ARP:0 };
const DQ_AK_ABAIXO = { ARG:10.2,ARGA:10.2,SAG:10.2,SAR:10.2,ARGS:10.2,ARS:0, ARE:0, ARP:0 };
const ALONSO_K = { ARG:10, ARGA:10, SAG:10, SAR:10, ARGS:10, ARS:10, ARE:20, ARP:20 };

// ============================================================
// MÉTODO 1 — P.P.C. Velloso
// RL = αi × λI × perimetro × CK65
// RP = 0.5 × λP × CX24 × areaPonta × 0.5 × (CL65+CP65)
// αi varia com tipo de estaca; αp FIXO = 0.5
// ============================================================
export function calcularVelloso(camadas, comprimento, geometria, tipoCarregamento, tipoEstaca) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const fat = FATORES_ESTACA[tipoEstaca] ?? FATORES_ESTACA.helice_continua;
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
  const RL = fat.alpha_i * lambdaI * perimetro * CK65;

  const janelaAcima = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let somaCL = 0;
  for (const c of janelaAcima) somaCL += (CP_V[c.tipo] ?? 25) * Math.min(c.spt, 40);
  const CL65 = somaCL / Math.max(janelaAcima.length, 1);

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
// F1 e F2 variam com tipo de estaca
// ============================================================
export function calcularAoki(camadas, comprimento, geometria, tipoEstaca) {
  const { perimetro, areaPonta } = geometria;
  const fat = FATORES_ESTACA[tipoEstaca] ?? FATORES_ESTACA.helice_continua;

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];

  let EB65 = 0;
  for (const c of lat) EB65 += (AK_LAT[c.tipo] ?? 0.88) * c.spt;
  const EC65 = (K_PONT[ponta.tipo] ?? 35) * ponta.spt;

  const RL = (perimetro / fat.F2) * EB65;
  const RP = (areaPonta / fat.F1) * EC65;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 3 — Décourt-Quaresma
// αK lateral varia por tipo de solo E tipo de estaca
// ============================================================
export function calcularDecourt(camadas, comprimento, geometria, tipoEstaca) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const CZ25 = Math.max(1, Math.round(8 * db));
  const dq_ak = DQ_AK_POR_ESTACA[tipoEstaca] ?? DQ_AK_POR_ESTACA.helice_continua;

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  const abaixo = ord.filter(c => c.cota > comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];
  const nLat = Math.max(lat.length, 1);

  let FU65 = 0;
  for (const c of lat) {
    const ak = dq_ak[c.tipo] ?? 0.7;
    const spt_dq = Math.max(3, Math.min(c.spt, 50));
    FU65 += ak * (spt_dq / 3 + 1);
  }

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
// β varia com tipo de estaca (BT por linha)
// ============================================================
export function calcularTeixeira(camadas, comprimento, geometria, tipoEstaca) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const fat = FATORES_ESTACA[tipoEstaca] ?? FATORES_ESTACA.helice_continua;
  const beta = fat.beta;
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

  const RL = HN65 * perimetro * beta;
  const RP = areaPonta * 0.5 * IN68;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// MÉTODO 5 — U.R. Alonso
// αp e fator 0.662 variam com tipo de estaca
// ============================================================
export function calcularAlonso(camadas, comprimento, geometria, tipoEstaca) {
  const { perimetro, areaPonta, diametro: db } = geometria;
  const CZ25 = Math.max(1, Math.round(8 * db));
  const fat = FATORES_ESTACA[tipoEstaca] ?? FATORES_ESTACA.helice_continua;

  const ord = [...camadas].filter(c => c.spt > 0).sort((a, b) => a.cota - b.cota);
  const lat = ord.filter(c => c.cota < comprimento);
  const atePonta = ord.filter(c => c.cota <= comprimento);
  if (atePonta.length === 0) return null;
  const ponta = atePonta[atePonta.length - 1];

  let CM122 = 0;
  for (const c of lat) CM122 += Math.min(c.spt, 40);

  const janelaAcima = atePonta.filter(c => { const cc = comprimento - c.cota; return cc >= 1 && cc <= CZ25; });
  let DG123 = 0;
  for (const c of janelaAcima) DG123 += (ALONSO_K[c.tipo] ?? 10) * Math.min(c.spt, 40);
  const DH123 = DG123 / Math.max(janelaAcima.length, 1);
  const DQ123 = (ALONSO_K[ponta.tipo] ?? 10) * Math.min(ponta.spt, 40);

  // CX12 = αp_Alonso por tipo; fator 0.662 varia por tipo de estaca
  const RL = CM122 * perimetro * fat.alphap_Al * fat.fat_Al;
  const RP = (DH123 + DQ123) * 0.5 * areaPonta;
  const Q = RL + RP;
  return { RL, RP, Q, Qadm: Q / 2 };
}

// ============================================================
// CALCULAR TODOS
// ============================================================
export function calcularTodos(camadas, comprimento, tipoSecao, dimensao, tipoCarregamento = 'compressao', tipoEstaca = 'helice_continua') {
  const geometria = calcularGeometria(tipoSecao, dimensao);
  const velloso  = calcularVelloso(camadas, comprimento, geometria, tipoCarregamento, tipoEstaca);
  const aoki     = calcularAoki(camadas, comprimento, geometria, tipoEstaca);
  const decourt  = calcularDecourt(camadas, comprimento, geometria, tipoEstaca);
  const teixeira = calcularTeixeira(camadas, comprimento, geometria, tipoEstaca);
  const alonso   = calcularAlonso(camadas, comprimento, geometria, tipoEstaca);

  const metodos = [velloso, aoki, decourt, teixeira, alonso].filter(Boolean);
  const media = metodos.length > 0 ? {
    RL:   metodos.reduce((s, m) => s + m.RL,   0) / metodos.length,
    RP:   metodos.reduce((s, m) => s + m.RP,   0) / metodos.length,
    Q:    metodos.reduce((s, m) => s + m.Q,    0) / metodos.length,
    Qadm: metodos.reduce((s, m) => s + m.Qadm, 0) / metodos.length,
  } : null;

  return { geometria, velloso, aoki, decourt, teixeira, alonso, media };
}
