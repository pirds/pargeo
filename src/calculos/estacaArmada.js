const NH_TABLE = {
  'Areia fofa (Seca)':           2.6,
  'Areia fofa (Submersa)':       1.5,
  'Areia medianamente (Seca)':   8.0,
  'Areia medianamente (Submersa)':5.0,
  'Areia compacta (Seca)':      20.0,
  'Areia compacta (Submersa)':  12.5,
  'Silte muito fofo (Seca)':     2.0,
  'Silte muito fofo (Submersa)': 2.0,
  'Argila muito mole':           0.55,
  'Argila média':                0.80,
  'Argila rija':                 5.00,
  'Argila muito rija':          10.00,
  'Argila dura':                19.50,
};

export const NH_OPTIONS = Object.keys(NH_TABLE);

const PESO_LINEAR = {
  5:0.1963, 6:0.2827, 6.3:0.3117, 7:0.3848, 8:0.5027,
  9.5:0.7088, 10:0.7854, 12.5:1.2272, 16:2.0106, 20:3.1416,
  22:3.8013, 25:4.9087, 32:8.0425, 40:12.5664,
};

export const PHI_OPTIONS = Object.keys(PESO_LINEAR).map(Number);

export function getPesoLinear(phi) {
  return PESO_LINEAR[phi] || PESO_LINEAR[10];
}

export function calcularArmaduraCompleto(p) {
  const { db, da, comprimento, Nc, Nt, M, H, fck, phi_long, n_barras, phi_est, cobrimento, tipo_solo } = p;

  const fcd = fck / 5;      // γc=5
  const fyd = 4200;         // CA-50

  // Área da seção
  const DI20 = (Math.pow(db, 2) / 4) * Math.PI;

  // Armadura de compressão
  const DJ20 = 1.4 * (Nc * 1000) * (1 + 6 / db);
  const DK20 = 0.85 * DI20 * fcd;
  const DL20 = (DJ20 - DK20) / fyd;
  const DL22 = Math.max(DL20, 0);
  const As_min_comp = DI20 * 0.004;
  const As_comp = Math.max(DL22, As_min_comp);

  // Armadura de tração
  const As_min_trac = DI20 * 0.004;
  const DL35 = (1.4 * Nt * 1000) / fyd;
  const As_trac = Nt > 0 ? Math.max(DL35, As_min_trac) : 0;

  // Armadura de momento
  const As_min_mom = DI20 * 0.0015;
  const DB36 = Nt > 0 ? ((1.4 * Nt) / Math.pow(db * 0.707106781, 2)) * 100 : 0;
  const As_mom = Math.max(DB36, As_min_mom);

  // Área adotada pelo usuário (longitudinal)
  const pl = getPesoLinear(phi_long);
  const As_adotada = n_barras * (Math.PI * Math.pow(phi_long / 10, 2) / 4); // cm²

  // Método Miche
  const nh = NH_TABLE[tipo_solo] || 8.0;
  const I = (Math.pow(db / 100, 4) * Math.PI) / 64; // m⁴
  const Es = 21000; // MPa
  const lambda = Math.pow((nh * 1000) / (4 * Es * I), 0.2);
  const delta_h = 2.4 * (Math.pow(lambda, 3) * H * 0.001 / (Es * I)) * 100; // cm
  const M_max = 0.79 * H * lambda; // ton.m
  const z_Mmax = 1.32 / lambda;    // m

  // Estribos — As mínima de cortante
  const As_cort_min = 4.4547727203 * (db / 45);
  const pe = getPesoLinear(phi_est);
  const perimetro_est = Math.PI * (db / 100 - 2 * (cobrimento / 100));
  const As_est_1 = Math.PI * Math.pow(phi_est / 10, 2) / 4; // cm² por estribo
  const espacamento_est = As_est_1 / As_cort_min * 100;     // cm

  // Quantitativos
  const vol_concreto = (Math.PI * Math.pow(db / 100, 2) / 4) * comprimento;
  const peso_aco_long = n_barras * comprimento * pl;
  const n_estribos = Math.ceil(comprimento / (espacamento_est / 100));
  const peso_aco_trans = n_estribos * perimetro_est * pe;

  return {
    Ac: +DI20.toFixed(2),
    As_comp: +As_comp.toFixed(2),
    As_min_comp: +As_min_comp.toFixed(2),
    As_trac: +As_trac.toFixed(2),
    As_min_trac: +As_min_trac.toFixed(2),
    As_mom: +As_mom.toFixed(2),
    As_min_mom: +As_min_mom.toFixed(2),
    As_cort_min: +As_cort_min.toFixed(2),
    As_adotada: +As_adotada.toFixed(2),
    M_max: +M_max.toFixed(3),
    z_Mmax: +z_Mmax.toFixed(3),
    delta_h: +delta_h.toFixed(3),
    espacamento_est: +espacamento_est.toFixed(1),
    vol_concreto: +vol_concreto.toFixed(3),
    peso_aco_long: +peso_aco_long.toFixed(2),
    peso_aco_trans: +peso_aco_trans.toFixed(2),
    lambda: +lambda.toFixed(4),
    nh,
  };
}

export function calcularArmaduraSimples({ carga, D, atrito_lateral, comprimento }) {
  const area = Math.PI * Math.pow(D, 2) / 4;
  const tensao = carga / area;
  const carga_excedente = carga - 50 * area;
  const necessita = tensao > 50;
  let comp_armar = 0;
  if (necessita && comprimento > 0) {
    comp_armar = (atrito_lateral / comprimento) * carga_excedente;
    comp_armar = Math.max(0, comp_armar);
  }
  return {
    area: +area.toFixed(2),
    tensao: +tensao.toFixed(2),
    necessita,
    comp_armar: +comp_armar.toFixed(2),
    aviso_excede: necessita && comp_armar > comprimento,
  };
}
