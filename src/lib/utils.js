// src/lib/utils.js

import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Função para concatenar/mesclar classes (Tailwind)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Converte a primeira letra para maiúscula e o resto para minúsculo
export const capitalizar = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Recebe um nome completo e retorna só "Primeiro Último" capitalizado
export const formatarNome = (nomeCompleto) => {
  if (!nomeCompleto) return "";
  const partes = nomeCompleto.trim().split(" ");
  if (partes.length === 1) return capitalizar(partes[0]);

  const primeiro = capitalizar(partes[0]);
  const ultimo = capitalizar(partes[partes.length - 1]);
  return `${primeiro} ${ultimo}`;
};

// Calcula quantos segundos se passaram desde dataCriacao até agora
export const calcularTempoDecorrido = (dataCriacao) => {
  return Math.floor((new Date() - new Date(dataCriacao)) / 1000);
};
