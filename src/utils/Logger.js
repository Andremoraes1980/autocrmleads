// src/utils/Logger.js
export function log(label, data) {
    console.log(`🧠 ${label}:`, JSON.stringify(data, null, 2));
  }
  
  export function warn(label, data) {
    console.warn(`⚠️ ${label}:`, JSON.stringify(data, null, 2));
  }
  
  export function error(label, data) {
    console.error(`❌ ${label}:`, JSON.stringify(data, null, 2));
  }
  