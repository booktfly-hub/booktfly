const fs = require('fs');
let code = fs.readFileSync('components/home/hero-section.tsx', 'utf-8');

code = code.replace(/providerCta=\{navT\('become_provider'\)\}\n\s*markeeteerCta=\{t\('for_marketeers_cta'\)\}\n/, '');

fs.writeFileSync('components/home/hero-section.tsx', code);
