const fs = require('fs');
const path = require('path');
const ttf2woff2 = require('ttf2woff2');

async function processFiles() {
  let convert = ttf2woff2;
  if (typeof convert !== 'function') {
    if (typeof convert.default === 'function') convert = convert.default;
    else if (typeof convert.ttf2woff2 === 'function') convert = convert.ttf2woff2;
    else {
      console.log('ttf2woff2 module:', ttf2woff2);
      throw new Error('Could not find convert function');
    }
  }

  // Convert ttf to woff2
  const fontsDir = path.join(__dirname, 'src', 'assets', 'fonts');
  const fonts = fs.readdirSync(fontsDir).filter(f => f.endsWith('.ttf'));
  
  for (const font of fonts) {
    const ttfPath = path.join(fontsDir, font);
    const woff2Path = path.join(fontsDir, font.replace('.ttf', '.woff2'));
    
    if (!fs.existsSync(woff2Path)) {
      const input = fs.readFileSync(ttfPath);
      const output = convert(input);
      fs.writeFileSync(woff2Path, output);
      console.log(`Converted ${font} to woff2`);
    }
  }
}

processFiles().catch(console.error);
