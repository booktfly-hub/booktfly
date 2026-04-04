const fs = require('fs');
let code = fs.readFileSync('components/home/hero-section-client.tsx', 'utf-8');

// Remove CTA links
code = code.replace(
  /<div\s+className="mb-8 flex items-center justify-center gap-3 animate-fade-in-up sm:flex-row"[\s\S]*?<\/div>/,
  ''
);

// Remove Trust Badges
code = code.replace(
  /<div className="mb-5 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up"[\s\S]*?<\/div>/,
  ''
);

// Remove Stats and Brands
code = code.replace(
  /<div className="mt-10 grid w-full max-w-5xl gap-4 animate-fade-in-up md:grid-cols-\[1\.2fr_0\.8fr\] md:gap-6"[\s\S]*?<\/div>\s*<\/div>/,
  ''
);

fs.writeFileSync('components/home/hero-section-client.tsx', code);
