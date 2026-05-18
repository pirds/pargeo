// Coeficientes extraídos diretamente das planilhas originais
const VELLOSO_CI = { ARG:0.85,ARGS:0.85,ARGA:0.60,SAG:0.60,SAR:0.50,AREA:0.50,ARS:0.50,ARE:0.50,ARP:0.50 };
const VELLOSO_CP_AC = { ARG:1.00,ARGS:1.00,ARGA:1.00,SAG:0.90,SAR:0.80,AREA:0.80,ARS:0.70,ARE:0.70,ARP:0.70 };
const VELLOSO_CP_AB = { ARG:0.90,ARGS:0.80,ARGA:0.65,SAG:0.65,SAR:0.50,AREA:0.50,ARS:0.50,ARE:0.50,ARP:0.50 };

const AOKI_LAT  = { ARG:0.85,ARGS:0.85,ARGA:0.85,SAG:0.60,SAR:0.60,AREA:0.50,ARS:0.50,ARE:1.40,ARP:1.40 };
const AOKI_AC   = { ARG:0.85,ARGS:0.85,ARGA:0.85,SAG:0.60,SAR:0.60,AREA:0.50,ARS:0.50,ARE:1.40,ARP:1.40 };
const AOKI_AB   = { ARG:0.85,ARGS:0.85,ARGA:0.85,SAG:0.60,SAR:0.60,AREA:0.50,ARS:0.50,ARE:0.84,ARP:0.84 };

const DQ_ALPHA  = { ARG:1.0,ARGS:1.0,ARGA:1.0,SAG:1.0,SAR:1.0,AREA:1.0,ARS:1.0,ARE:1.0,ARP:1.0 };
const DQ_BETA   = { ARG:0.85,ARGS:0.85,ARGA:0.85,SAG:0.60,SAR:0.60,AREA:0.50,ARS:0.50,ARE:0.50,ARP:0.50 };

const TEI_BETA  = { ARG:0.4,ARGS:0.4,ARGA:0.4,SAG:0.4,SAR:0.4,AREA:0.4,ARS:0.4,ARE:0.4,ARP:0.4 };
const TEI_ALPHA_COMP = { ARG:11,ARGS:11,ARGA:21,SAG:16,SAR:26,AREA:30,ARS:36,ARE:40,ARP:44 };
const TEI_ALPHA_TRAC = { ARG:10,ARGS:10,ARGA:16,SAG:12,SAR:21,AREA:24,ARS:30,ARE:34,ARP:38 };

const ALO_ALPHA = { ARG:0.67,ARGS:0.67,ARGA:0.65,SAG:0.56,SAR:0.59,AREA:0.65,ARS:0.65,ARE:0.65,ARP:0.65 };
const ALO_8DB   = { ARG:10,ARGS:10,ARGA:10,SAG:15,SAR:15,AREA:20,ARS:20,ARE:20,ARP:20 };

export function calcularGeometria(tipo_secao, dimensao_mm) {
  if (tipo_secao === 'circular') {
    const D = dimensao_mm / 1000;
    return { perimetro: Math.PI * D, area_ponta: Math.PI * D * D / 4 };
  } else {
    const L = dimensao_mm / 1000;
    return { perimetro: 4 * L, area_ponta: L * L };
  }
}

// camadas: [{cota, spt, tipo}], comprimento em m
// tipo_carga: 'compressao' | 'tracao'
function buildCamadas(camadas, comprimento) {
  // Filtra camadas até o comprimento da estaca
  const sorted = [...camadas].sort((a, b) => a.cota - b.cota);
  const ativas = sorted.filter(c => c.cota <= comprimento && c.spt !== '' && c.tipo);
  if (ativas.length < 2) return { laterais: [], ponta: null };

  // Última camada: ponta
  const ponta = ativas[ativas.length - 1];
  const laterais = [];
  for (let i = 0; i < ativas.length - 1; i++) {
    const delta_z = ativas[i + 1].cota - ativas[i].cota;
    laterais.push({ ...ativas[i], delta_z, spt: Number(ativas[i].spt) });
  }
  return { laterais, ponta: { ...ponta, spt: Number(ponta.spt) } };
}

export function calcularVelloso(camadas, geometria, tipoCarregamento) {
  const { perimetro, areaPonta } = geometria;

  const Ci = {
    ARG: 0.85, ARGS: 0.85, ARGA: 0.60,
    SAG: 0.60, SAR: 0.50, AREA: 0.50,
    ARS: 0.50, ARE: 0.50, ARP: 0.50
  };
  const Cp = {
    ARG: 1.00, ARGS: 1.00, ARGA: 1.00,
    SAG: 0.90, SAR: 0.80, AREA: 0.80,
    ARS: 0.70, ARE: 0.70, ARP: 0.70
  };

  // Encontra a camada da ponta (última com SPT > 0)
  const camadasValidas = camadas.filter(c => c.spt > 0);
  if (camadasValidas.length === 0) return null;
  const camadaPonta = camadasValidas[camadasValidas.length - 1];

  // Atrito lateral (todas as camadas exceto a ponta)
  let RL = 0;
  const camadasLaterais = camadasValidas.slice(0, -1);
  for (let i = 0; i < camadasLaterais.length; i++) {
    const c = camadasLaterais[i];
    const proxima = camadasValidas[i + 1];
    const deltaZ = proxima.cota - c.cota;
    const sptCons = Math.min(c.spt, 40);
    const ci = Ci[c.tipo] ?? 0.50;
    RL += ci * sptCons * perimetro * deltaZ;
  }

  // Resistência de ponta
  const sptPonta = Math.min(camadaPonta.spt, 40);
  const cp = Cp[camadaPonta.tipo] ?? 0.70;
  const RP = cp * sptPonta * areaPonta;

  const Q = RL + RP;
  const Qadm = Q / 2;
  return { RL, RP, Q, Qadm };
}

export function calcularAoki(camadas, comprimento, geo, tipo_carga) {
  const { laterais, ponta } = buildCamadas(camadas, comprimento);
  if (!ponta) return null;
  const F1 = 2, F2 = 4;
  const lambda_i = tipo_carga === 'compressao' ? 1 : 0;
  const lambda_p = tipo_carga === 'compressao' ? 1 : 0;

  let RL = 0;
  for (const cam of laterais) {
    const ak = AOKI_LAT[cam.tipo] || 0.5;
    RL += (ak * cam.spt / F2) * geo.perimetro * cam.delta_z * lambda_i;
  }
  const ak_p = AOKI_AB[ponta.tipo] || 0.5;
  const RP = (ak_p * ponta.spt / F1) * geo.area_ponta * lambda_p;
  const Q = RL + RP;
  return { RL: +RL.toFixed(3), RP: +RP.toFixed(3), Q: +Q.toFixed(3), Qadm: +(Q/2).toFixed(3) };
}

export function calcularDecourt(camadas, comprimento, geo, tipo_carga) {
  const { laterais, ponta } = buildCamadas(camadas, comprimento);
  if (!ponta) return null;
  const lambda_i = tipo_carga === 'compressao' ? 1 : 0;
  const lambda_p = tipo_carga === 'compressao' ? 1 : 0;

  let RL = 0;
  for (const cam of laterais) {
    const spt = Math.max(3, Math.min(cam.spt, 50));
    const beta = DQ_BETA[cam.tipo] || 0.5;
    const alpha = DQ_ALPHA[cam.tipo] || 1.0;
    RL += ((beta / 3) * spt + alpha) * geo.perimetro * cam.delta_z * lambda_i;
  }
  // Ponta: usa alpha_p = 0.85 (valor médio da planilha para ponta)
  const alpha_p = 0.85;
  const spt_p = Math.max(3, Math.min(ponta.spt, 50));
  const RP = alpha_p * spt_p * geo.area_ponta * lambda_p;
  const Q = RL + RP;
  return { RL: +RL.toFixed(3), RP: +RP.toFixed(3), Q: +Q.toFixed(3), Qadm: +(Q/2).toFixed(3) };
}

export function calcularTeixeira(camadas, comprimento, geo, tipo_carga) {
  const { laterais, ponta } = buildCamadas(camadas, comprimento);
  if (!ponta) return null;
  const lambda_i = tipo_carga === 'compressao' ? 1 : 0;
  const lambda_p = tipo_carga === 'compressao' ? 1 : 0;

  let RL = 0;
  for (const cam of laterais) {
    const beta = TEI_BETA[cam.tipo] || 0.4;
    RL += beta * cam.spt * geo.perimetro * cam.delta_z * lambda_i;
  }
  const alpha_p = tipo_carga === 'compressao'
    ? (TEI_ALPHA_COMP[ponta.tipo] || 30)
    : (TEI_ALPHA_TRAC[ponta.tipo] || 24);
  const RP = alpha_p * ponta.spt * geo.area_ponta * lambda_p;
  const Q = RL + RP;
  return { RL: +RL.toFixed(3), RP: +RP.toFixed(3), Q: +Q.toFixed(3), Qadm: +(Q/2).toFixed(3) };
}

export function calcularAlonso(camadas, comprimento, geo, tipo_carga, dimensao_mm) {
  const { laterais, ponta } = buildCamadas(camadas, comprimento);
  if (!ponta) return null;
  const db_m = dimensao_mm / 1000;
  const zona_8db = 8 * db_m;
  const ponta_cota = ponta.cota;
  const lambda_p = tipo_carga === 'compressao' ? 1 : 0;

  let RL = 0;
  for (const cam of laterais) {
    const dist_ponta = ponta_cota - cam.cota;
    const coef = ALO_8DB[cam.tipo] || 20;
    if (dist_ponta <= zona_8db) {
      RL += coef * cam.spt * geo.perimetro * cam.delta_z;
    } else {
      RL += (coef * 0.5) * cam.spt * geo.perimetro * cam.delta_z;
    }
  }
  const alpha_p = ALO_ALPHA[ponta.tipo] || 0.65;
  const RP = alpha_p * ponta.spt * geo.area_ponta * lambda_p;
  const Q = RL + RP;
  return { RL: +RL.toFixed(3), RP: +RP.toFixed(3), Q: +Q.toFixed(3), Qadm: +(Q/2).toFixed(3) };
}

export function calcularTodos(camadas, comprimento, geo, tipo_carga, dimensao_mm) {
  const velloso  = calcularVelloso(camadas, { perimetro: geo.perimetro, areaPonta: geo.area_ponta }, tipo_carga);
  const aoki     = calcularAoki(camadas, comprimento, geo, tipo_carga);
  const decourt  = calcularDecourt(camadas, comprimento, geo, tipo_carga);
  const teixeira = calcularTeixeira(camadas, comprimento, geo, tipo_carga);
  const alonso   = calcularAlonso(camadas, comprimento, geo, tipo_carga, dimensao_mm);

  const valid = [velloso, aoki, decourt, teixeira, alonso].filter(Boolean);
  const media = valid.length ? {
    RL:   +(valid.reduce((s, m) => s + m.RL, 0) / valid.length).toFixed(3),
    RP:   +(valid.reduce((s, m) => s + m.RP, 0) / valid.length).toFixed(3),
    Q:    +(valid.reduce((s, m) => s + m.Q,  0) / valid.length).toFixed(3),
    Qadm: +(valid.reduce((s, m) => s + m.Qadm, 0) / valid.length).toFixed(3),
  } : null;

  return { velloso, aoki, decourt, teixeira, alonso, media };
}
