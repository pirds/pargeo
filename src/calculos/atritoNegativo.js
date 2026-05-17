export function calcularAtritoConvencional({ D, H_aterro, c }) {
  // F_neg_conv (ton)
  const F = Math.PI * (D / 100) * H_aterro * c;
  return +F.toFixed(3);
}

export function calcularAtritoBeer({ D, H_aterro, gamma_aterro, H_comp, gamma_comp, phi }) {
  const area_ponta = Math.PI * Math.pow(D / 100, 2) / 4;
  const perimetro  = Math.PI * (D / 100);
  const phi_rad    = (phi * Math.PI) / 180;
  const Kg         = (1 - Math.sin(phi_rad)) * Math.tan(phi_rad);
  const fator_lat  = perimetro * H_comp * Kg;
  const beta_dec   = fator_lat / area_ponta;
  const exp_fator  = Math.exp(-beta_dec);

  const q_medio_comp = gamma_comp * H_comp;
  const RI_comp  = area_ponta * (q_medio_comp / H_comp) * H_comp * (1 - exp_fator);
  const BD19     = area_ponta * gamma_aterro;
  const RI_aterro = BD19 * gamma_aterro * H_aterro * (1 - (beta_dec !== 0 ? (1 - exp_fator) / beta_dec : 0));
  const F_total   = (RI_comp + RI_aterro) * (area_ponta / (D / 100));
  return +Math.abs(F_total).toFixed(3);
}
