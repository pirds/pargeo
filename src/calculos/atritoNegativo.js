export function calcularAtritoConvencional({ D, H_aterro, H_comp, c }) {
  // BC34 = PI × (D/100) × H_comp × c
  const F = Math.PI * (D / 100) * H_comp * c;
  return +F.toFixed(3);
}

export function calcularAtritoBeer({ D, H_aterro, gamma_aterro, H_comp, gamma_comp, phi }) {
  const BD18     = Math.PI * Math.pow(H_comp, 2) / 4;   // PI×H_comp²/4
  const BD19     = Math.PI * Math.pow(H_comp, 2) / 16;  // BD18/4
  const perimetro  = Math.PI * (D / 100);
  const phi_rad    = (phi * Math.PI) / 180;
  const Kg         = (1 - Math.sin(phi_rad)) * Math.tan(phi_rad);
  const fator_lat  = perimetro * H_comp * Kg;
  const beta_dec   = fator_lat / BD18;
  const exp_fator  = Math.exp(-beta_dec);

  const q_medio_comp = gamma_comp * H_comp;
  const RI_comp  = BD18 * (q_medio_comp / H_comp) * H_comp * (1 - exp_fator);
  const RI_aterro = BD19 * gamma_aterro * H_aterro * (1 - (beta_dec !== 0 ? (1 - exp_fator) / beta_dec : 0));
  const F_total   = (RI_comp + RI_aterro) * (BD18 / (D / 100));
  return +Math.abs(F_total).toFixed(3);
}
