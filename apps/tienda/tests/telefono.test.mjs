// Prueba rápida de la máscara y validación del teléfono (misma lógica que Carrito.tsx).
import assert from "node:assert/strict";
const soloDigitos = (v) => { const d = v.replace(/\D/g, ""); return (d.length > 8 && d.startsWith("503") ? d.slice(3) : d).slice(0, 8); };
const conMascara = (v) => { const d = soloDigitos(v); return d.length > 4 ? `${d.slice(0, 4)}-${d.slice(4)}` : d; };
const valido = (v) => /^[267]\d{7}$/.test(soloDigitos(v));
assert.equal(conMascara("+503 7916 5515"), "7916-5515");
assert.equal(conMascara("79165515"), "7916-5515");
assert.equal(conMascara("7916"), "7916");
assert.equal(conMascara("791655159999"), "7916-5515");
assert.ok(valido("+503 7916-5515"));
assert.ok(valido("2222-3333"));
assert.ok(!valido("8916-5515"));
assert.ok(!valido("7916-551"));
console.log("teléfono ok");
