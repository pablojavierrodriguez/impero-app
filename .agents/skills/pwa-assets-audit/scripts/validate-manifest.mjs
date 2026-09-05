import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../..');

const manifestPath = path.join(projectRoot, 'public/manifest.webmanifest');
const publicDir = path.join(projectRoot, 'public');

console.log('🔍 Iniciando auditoría de PWA Manifest & Assets...');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: public/manifest.webmanifest no encontrado.');
  process.exit(1);
}

let manifest;
try {
  const content = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(content);
  console.log('✅ JSON de manifest.webmanifest parseado correctamente.');
} catch (err) {
  console.error('❌ Error parseando JSON de manifest.webmanifest:', err.message);
  process.exit(1);
}

const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
let missingFields = 0;
for (const field of requiredFields) {
  if (!manifest[field]) {
    console.warn(`⚠️ Advertencia: Campo recomendado ausente en manifest: "${field}"`);
    missingFields++;
  }
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  console.error('❌ Error: manifest.webmanifest no define ningún ícono.');
  process.exit(1);
}

console.log(`📦 Verificando ${manifest.icons.length} íconos declarados...`);

let missingIcons = 0;
for (const icon of manifest.icons) {
  const relativePath = icon.src.startsWith('/') ? icon.src.slice(1) : icon.src;
  const filePath = path.join(publicDir, relativePath);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✓ Encontrado: ${icon.src} (${icon.sizes || 'sin tamaño'}, ${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error(`  ✗ NO EXISTE: ${icon.src} -> Archivo esperado: ${filePath}`);
    missingIcons++;
  }
}

if (missingIcons > 0) {
  console.error(`\n❌ Auditoría fallida: ${missingIcons} ícono(s) no existen en el disco.`);
  process.exit(1);
}

console.log('\n🎉 Auditoría completada con éxito. Todos los assets del manifest existen.');
