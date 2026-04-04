const fs = require('fs');
let code = fs.readFileSync('components/layout/navbar.tsx', 'utf-8');

// Update Logo sizes
const oldLogoClassName = `              className={cn(
                "w-auto transition-all duration-500 object-contain -my-4 sm:-my-10 lg:-my-12", 
                scrolled ? "h-14 sm:h-24" : "h-16 sm:h-32 lg:h-36"
              )} `
const newLogoClassName = `              className={cn(
                "w-auto transition-all duration-500 object-contain", 
                scrolled ? "h-10 sm:h-12" : "h-12 sm:h-16"
              )} `

code = code.replace(oldLogoClassName, newLogoClassName);

// Add rounded-xl to nav items
code = code.replace(
  /"inline-flex items-center gap-2 border-none px-4 py-2 text-sm font-bold transition-all",/g,
  `"inline-flex items-center gap-2 border-none px-4 py-2 text-sm font-bold transition-all rounded-xl",`
);

fs.writeFileSync('components/layout/navbar.tsx', code);
