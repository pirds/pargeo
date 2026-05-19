// ============================================================
// DIMENSIONAMENTO DE ESTACA ARMADA
// Fórmulas validadas da planilha Excel original
// Referência (db=45cm, da=35cm, L=12m, Nc=50tf, H=2tf, M=100kgm):
//   As gov comp = 6.36 cm²
//   As min cort = 4.45 cm²
//   lambda = 1.3951 m⁻¹
//   delta = 0.3237 cm
//   M_max = 2.3144 tf.m
//   z_Mmax = 1.8415 m
// ============================================================

// TABELA nh por tipo de solo e situação (MN/m³)
// CK..CL por tipo: CJ=4→nh seca, CJ=6→nh submersa
export const NH_TABLE = {
  'areia_fofa':        { seca: 2.6,  submersa: 1.5  },
  'areia_media':       { seca: 8.0,  submersa: 5.0  },
  'areia_compacta':    { seca: 20.0, submersa: 12.5 },
  'silte_fofo':        { seca: 2.0,  submersa: 2.0  },
  'argila_mole':       { seca: 0.55, submersa: 0.55 },
  'argila_media':      { seca: 0.80, submersa: 0.80 },
  'argila_rija':       { seca: 5.00, submersa: 5.00 },
  'argila_muito_rija': { seca: 10.0, submersa: 10.0 },
  'argila_dura':       { seca: 19.5, submersa: 19.5 },
};

// TABELA de pesos lineares por diâmetro (kg/m)
export const PESO_BARRA = {
  5: 0.1963, 6: 0.2827, 6.3: 0.3117, 7: 0.3848,
  8: 0.5027, 9.5: 0.7088, 10: 0.7854, 12.5: 1.2272,
  16: 2.0106, 20: 3.1416, 22: 3.8013, 25: 4.9087,
  32: 8.0425, 40: 12.5664
};

// TABELA espaçamento estribos (DC35→DC36→DC38)
// DC35 = DD33/DA18 = As_min_cort / (phi_long²/4×PI/100)
// DC36 = ROUND(DC35, 0) = número de estribos por m
// DC38 = ((100-(DC36×phi_est/10))/DC36)×2 = espaçamento em cm
export function calcularEspacamentoEstribos(db, phi_long, phi_est) {
  const DA18 = ((phi_long * phi_long) / 4) * Math.PI / 100; // área 1 barra long (cm²)
  const DD33 = 0.14 * 0.707106781 * db;                      // As min cortante
  const DC35 = DD33 / DA18;
  const DC36 = Math.round(DC35);
  const DC38 = ((100 - (DC36 * phi_est / 10)) / DC36) * 2;
  return { DC36, DC38: Math.max(DC38, 5) };
}

// FUNÇÃO PRINCIPAL DE CÁLCULO
export function calcularEstacaArmada(params) {
  const {
    da,           // cobrimento ao centro da barra (cm)
    db,           // diâmetro da estaca (cm)
    comprimento,  // comprimento total (m)
    Nc,           // carga de compressão (tf)
    atrito,       // atrito lateral da fundação (tf)
    Nt,           // carga de tração (tf)
    M,            // momento (kgm)
    H,            // carga horizontal (tf)
    fck,          // resistência característica (kg/cm²)
    phi_long,     // diâmetro barra longitudinal (mm)
    phi_est,      // diâmetro dos estribos (mm)
    cobrimento,   // cobrimento nominal (cm)
    tipo_solo,    // chave do NH_TABLE
    situacao,     // 'seca' ou 'submersa'
  } = params;

  // Parâmetros de resistência
  const fcd = fck / 5;       // DG20 = T12/DF29
  const fyd = 4200;          // CA-50

  // Geometria
  const Ac = ((db * db) / 4) * Math.PI;       // DI20 (cm²)
  const ddb = da / db;                          // DI41 = da/db

  // ── AS DE COMPRESSÃO ──────────────────────────────────────
  // DJ20 = 1.4×Nc×1000×(1+6/db)
  // DK20 = 0.85×Ac×fcd
  // DL20 = (DJ20-DK20)/fyd
  const DJ20 = 1.4 * (Nc * 1000) * (1 + 6 / db);
  const DK20 = 0.85 * Ac * fcd;
  const As_comp_calc = Math.max((DJ20 - DK20) / fyd, 0);  // DL22
  const As_min_comp  = Ac * 0.004;                          // DL25
  const As_comp      = Math.max(As_comp_calc, As_min_comp); // DL26

  // ── AS DE TRAÇÃO ──────────────────────────────────────────
  // DL35 = (1.4×Nt×1000)/fyd
  const As_trac_calc = Nt > 0 ? (1.4 * Nt * 1000) / fyd : 0;
  const As_min_trac  = Nt > 0 ? Ac * 0.004 : 0;
  const As_trac      = Math.max(As_trac_calc, As_min_trac);

  // ── AS DE MOMENTO ─────────────────────────────────────────
  // DK42 = (1.4×M) / (db³ × fcd) × 100  [db em cm, M em kgm, fcd em kg/cm²]
  // DJ47 = 4.667 (tabela interpolação para da/db ≤ 0.8)
  // DK44 = DJ47 × DK42
  // DK47 = (DK44 × Ac × fcd) / fyd
  // DK48 = Ac × 0.0015
  const DK42 = (1.4 * M) / (Math.pow(db, 3) * fcd) * 100;
  const DJ47 = ddb <= 0.80 ? 4.667 :
               ddb <= 0.85 ? 4.500 :
               ddb <= 0.90 ? 4.400 :
               ddb <= 0.95 ? 3.900 : 3.500;
  const DK44 = DJ47 * DK42;
  const As_mom_calc  = (DK44 * Ac * fcd) / fyd;          // DK47
  const As_min_mom   = Ac * 0.0015;                        // DK48
  const As_mom       = Math.max(As_mom_calc, As_min_mom);

  // ── NÚMERO DE BARRAS LONGITUDINAIS ────────────────────────
  const As_gov = Math.max(As_comp, As_trac, As_mom);
  const area_barra_long = ((phi_long * phi_long) / 4) * Math.PI / 100; // DA18 (cm²)
  const area_barra_est  = ((phi_est  * phi_est)  / 4) * Math.PI / 100; // DB18 (cm²)
  const n_barras_calc = Math.max(4, Math.ceil(As_gov / area_barra_long));
  const n_barras_min  = n_barras_calc;
  const As_fornecido  = n_barras_calc * area_barra_long;

  // ── AS DE CORTANTE ────────────────────────────────────────
  const DC7  = 420;
  const DB35 = Math.pow(db * 0.707106781, 2);
  const DB36 = H > 0 ? ((1.4 * H) / DB35) * 100 : 0;
  const CZ32 = n_barras_calc / 3 * 2;
  const CZ33 = Math.round(CZ32);
  const CZ34 = (CZ33 * area_barra_long) / Ac;
  const CZ35 = CZ34 <= 0.001 ? 0.07 : 0;
  const CZ36 = CZ34 >= 0.015 ? 0.14 : 0;
  const CZ37 = (CZ35 + CZ36 === 0) ? ((CZ34 - 0.001) * 5) + 0.07 : 0;
  const CZ38 = CZ35 + CZ36 + CZ37;
  const DB32 = CZ38 * Math.sqrt(phi_long);
  const DB38 = H > 0 ? (1.15 * DB36) - DB32 : 0;
  const As_cort_calc = DB38 > 0 ? (100 / DC7) * (0.707106781 * db) * DB38 : 0;
  const As_min_cort  = 0.14 * 0.707106781 * db;
  const As_cort      = Math.max(As_cort_calc, As_min_cort);

  // ── ESPAÇAMENTO DE ESTRIBOS ──────────────────────────────
  // DC35 = As_min_cort / area_barra_est (estribo, não longitudinal)
  // DC36 = ROUND(DC35, 0)
  // DC38 = ((100 - (DC36×phi_est/10)) / DC36) × 2
  const DC35 = As_min_cort / area_barra_est;
  const DC36 = Math.round(DC35);
  const espacamento_estribos = ((100 - (DC36 * phi_est / 10)) / DC36) * 2;

  console.log('[estacaArmada] area_barra_long', area_barra_long.toFixed(4),
    'area_barra_est', area_barra_est.toFixed(4),
    'As_min_cort', As_min_cort.toFixed(4),
    'DC35', DC35.toFixed(4), 'DC36', DC36, 'esp', espacamento_estribos.toFixed(2));

  // ── MÉTODO MICHE (estaca longa, topo livre) ───────────────
  // CL28 = ((db⁴/10⁸)×PI)/64  (m⁴)
  // CL31 = (Es×CL28)/nh        (m⁵/MN)
  // CL32 = CL31^0.2             (lambda, m⁻¹)
  // CO33 = M/1000 + H           (MN equivalente)
  // delta = 2.4×(lambda³×CO33×0.001)/(Es×I) × 1000 cm
  // M_max = 0.79×CO33×lambda   (tf.m)
  // z_Mmax = 1.32×lambda        (m)
  const nh = NH_TABLE[tipo_solo]?.[situacao] ?? 8.0;
  const Es = 21000; // MPa
  const I  = ((db * db * db * db) / 100000000) * Math.PI / 64; // m⁴ (CL28)
  const CL31  = (Es * I) / nh;
  const lambda = Math.pow(CL31, 0.2);                            // CL32
  const CO33  = M / 1000 + H;                                    // tf equivalente
  const CL35  = 2.4 * (Math.pow(lambda, 3) * CO33 * 0.001) / (Es * I);
  const delta  = CL35 * 1000;                                    // cm (CN53/10)
  const M_max     = 0.79 * CO33 * lambda;          // tf.m (CL36)
  const z_Mmax    = 1.32 * lambda;                 // m (CL37)
  const prof_momento = lambda * 4;                 // m (CL33 = profundidade de influência)
  const z_zero    = [1.32/lambda, 2.64/lambda, 3.96/lambda]; // m

  // ── QUANTITATIVOS ─────────────────────────────────────────
  const vol_concreto = Ac * comprimento / 10000;                          // m³
  const peso_linear_long = area_barra_long * 0.785;                       // kg/m (DE18)
  const peso_aco_long    = comprimento * n_barras_calc * peso_linear_long; // kg
  const perim_estribo    = Math.PI * (db / 100 - 2 * (cobrimento / 100)); // m
  const n_estribos       = Math.ceil((comprimento * 100) / espacamento_estribos);
  const peso_linear_est  = area_barra_est * 0.785;                        // kg/m
  const peso_aco_trans   = n_estribos * perim_estribo * peso_linear_est;  // kg
  console.log('[estacaArmada] n_estribos', n_estribos, 'perim_estribo', perim_estribo.toFixed(4),
    'peso_lin_est', peso_linear_est.toFixed(4), 'peso_aco_trans', peso_aco_trans.toFixed(2));

  return {
    // Geometria
    Ac, ddb, fcd,
    // Armaduras
    As_comp_calc, As_min_comp, As_comp,
    As_trac_calc, As_min_trac, As_trac,
    As_mom_calc, As_min_mom, As_mom,
    As_cort_calc, As_min_cort, As_cort,
    As_gov,
    // Barras
    n_barras_calc, n_barras_min, As_fornecido, area_barra: area_barra_long,
    // Estribos
    DC36, espacamento_estribos,
    // Miche
    nh, lambda, delta, M_max, z_Mmax, prof_momento, z_zero,
    // Quantitativos
    vol_concreto, peso_aco_long, peso_aco_trans,
  };
}

// ── COMPATIBILIDADE ──────────────────────────────────────────
export const NH_OPTIONS = Object.keys(NH_TABLE);
export const PHI_OPTIONS = Object.keys(PESO_BARRA).map(Number);

export function calcularCompressaoSimplificada({ Nc, db, atrito_lateral, comprimento }) {
  const Ac = (Math.PI * db * db) / 4;
  const tensao = (Nc * 1000) / Ac;

  if (tensao <= 50) {
    return { tensao, Ac, necessita_armacao: false, comp_armar: 0, msg: 'Não necessita armação (tensão ≤ 50 kg/cm²)' };
  }

  const Nc_kg = Nc * 1000;
  const carga_excedente = Nc_kg - 50 * Ac;
  const atrito_kg = atrito_lateral * 1000;
  const comp_armar_raw = atrito_kg > 0 ? (comprimento / atrito_kg) * carga_excedente : comprimento;
  const comp_armar = Math.min(comp_armar_raw, comprimento);

  return {
    tensao, Ac, carga_excedente,
    necessita_armacao: true,
    comp_armar,
    msg: comp_armar_raw > comprimento
      ? 'Comprimento a armar > comprimento total. Rever dimensionamento!'
      : `Armar os primeiros ${comp_armar.toFixed(2)} m`,
  };
}

export function calcularArmaduraSimples({ carga, D, atrito_lateral, comprimento }) {
  return calcularCompressaoSimplificada({ Nc: carga / 1000, db: D, atrito_lateral: atrito_lateral / 1000, comprimento });
}
