export const capitalizar = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  export const formatarNome = (nomeCompleto) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return capitalizar(partes[0]);
    const primeiro = capitalizar(partes[0]);
    const ultimo = capitalizar(partes[partes.length - 1]);
    return `${primeiro} ${ultimo}`;
  };

  // utils.js
export const calcularTempoDecorrido = (dataCriacao) => {
  return Math.floor((new Date() - new Date(dataCriacao)) / 1000);
};

  