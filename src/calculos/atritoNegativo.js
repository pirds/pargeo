export function calcularAtritoConvencional({ D, H_aterro, H_comp, c }) {
  // BC34 = PI × (D/100) × H_comp × c
  const F = Math.PI * (D / 100) * H_comp * c;
  return +F.toFixed(3);
}

export function calcularAtritoBeer({ D, H_aterro, gamma_aterro, H_comp, gamma_seco, phi, NA }) {
  const BD18    = Math.PI * Math.pow(H_comp, 2) / 4;
  const BD19    = Math.PI * Math.pow(H_comp, 2) / 16;
  const phi_rad = phi * Math.PI / 180;
  const BG21    = (1 - Math.sin(phi_rad)) * Math.tan(phi_rad);  // Kg
  const BD23    = Math.PI * (D / 100) * H_comp * BG21;
  const BD26    = BD23 / BD18;   // β decaimento
  const BD27    = BD23 / BD19;   // 4×BD26

  // Pesos ponderados — aterro
  const BR21 = H_aterro > NA ? NA : 0;
  const BT21 = BR21 > 0 ? BR21 * gamma_aterro : 0;
  const BR22 = NA >= H_aterro ? H_aterro : 0;
  const BT22 = BR22 > 0 ? BR22 * gamma_aterro : 0;
  const BR23 = H_aterro > NA ? H_aterro - NA : 0;
  const BT23 = BR23 > 0 ? BR23 * (gamma_aterro - 1) : 0;
  const BT24 = BT21 + BT22 + BT23;
  const BU24 = BT24 / H_aterro;

  // Pesos ponderados — camada compressível
  const BS19    = NA >= H_aterro ? NA - H_aterro : 0;
  const H_total = H_aterro + H_comp;
  const BR29    = H_total >= NA ? H_comp - BS19 : 0;
  const BT29    = BR29 > 0 ? BR29 * (gamma_seco - 1) : 0;
  const BT30    = BT29;
  const BU30    = BT30 / H_comp;

  const BD29 = H_aterro * BU24;
  const BF29 = Math.exp(-BD26);
  const BF30 = Math.exp(-BD27);

  const BI29 = BD18 * BD29 * (1 - BF29);
  const BI30 = BD19 * BU30 * H_comp * (1 - (1 - BF30) / BD27);
  const BI31 = BI29 + BI30;
  return +BI31.toFixed(3);
}
