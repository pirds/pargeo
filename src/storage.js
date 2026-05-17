// Abstraction over window.storage / localStorage
const store = (typeof window !== 'undefined' && window.storage) ? window.storage : localStorage;

export const get = (key) => {
  try {
    const v = store.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};

export const set = (key, value) => {
  try { store.setItem(key, JSON.stringify(value)); } catch {}
};

export const remove = (key) => {
  try { store.removeItem(key); } catch {}
};

export const getUsers = () => get('users') || [];
export const setUsers = (u) => set('users', u);

export const getSession = () => get('session_active');
export const setSession = (s) => set('session_active', s);
export const clearSession = () => remove('session_active');

export const getObras = (userId) => get(`obras_${userId}`) || [];
export const setObras = (userId, obras) => set(`obras_${userId}`, obras);

export const getObraAtiva = (userId) => get(`obra_ativa_${userId}`);
export const setObraAtiva = (userId, obra) => set(`obra_ativa_${userId}`, obra);

export const getCalculosCarga = (obraId) => get(`calculos_carga_${obraId}`) || [];
export const setCalculosCarga = (obraId, c) => set(`calculos_carga_${obraId}`, c);

export const getCalculosArmada = (obraId) => get(`calculos_armada_${obraId}`) || [];
export const setCalculosArmada = (obraId, c) => set(`calculos_armada_${obraId}`, c);

export const getCalculosAtrito = (obraId) => get(`calculos_atrito_${obraId}`) || [];
export const setCalculosAtrito = (obraId, c) => set(`calculos_atrito_${obraId}`, c);

export const encodePass = (p) => btoa(p);
export const decodePass = (p) => { try { return atob(p); } catch { return ''; } };
