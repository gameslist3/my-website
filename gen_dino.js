const fs = require('fs');

const ascii_dino = `
        xxxxxxxx 
       xxxxxxxxx 
       xx xxxxx  
       xxxxxxxx  
       xxxxxxxx  
       xxxxx     
       xxxxxxx   
       xxxxx     
x      xxxx      
xx    xxxxxx     
xxx   xxxxxx     
xxxxxxxxxxxx     
 xxxxxxxxxxx     
  xxxxxxxxxx     
   xxxxxxxxx     
    xxxxxxx      
     xxxxx       
     xx xx       
     xx   x      
     x           
`;

let rects = '';
const lines = ascii_dino.replace(/^\n/, '').split('\n');
lines.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
        if (line[x] === 'x') {
            rects += `  <rect x="${x * 2}" y="${y * 2}" width="2" height="2" fill="currentColor" />\n`;
        }
    }
});

const comp = `import React from "react";

export const DinoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg" {...props}>
${rects}  </svg>
);
`;

fs.writeFileSync('src/components/DinoIcon.tsx', comp, 'utf8');
console.log('Done');
