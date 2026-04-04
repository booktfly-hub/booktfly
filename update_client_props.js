const fs = require('fs');
let code = fs.readFileSync('components/home/hero-section-client.tsx', 'utf-8');

code = code.replace(/providerCta: string\n\s*markeeteerCta: string\n/, '');

fs.writeFileSync('components/home/hero-section-client.tsx', code);
