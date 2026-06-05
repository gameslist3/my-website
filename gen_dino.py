ascii_dino = '''
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
'''
rects = ''
lines = ascii_dino.strip('\n').split('\n')
for y, line in enumerate(lines):
    for x, c in enumerate(line):
        if c == 'x':
            rects += f'  <rect x="{x*2}" y="{y*2}" width="2" height="2" fill="currentColor" />\n'

comp = f'''import React from "react";

export const DinoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 40 44" width="40" height="44" xmlns="http://www.w3.org/2000/svg" {{...props}}>
{rects}  </svg>
);
'''

with open('src/components/DinoIcon.tsx', 'w', encoding='utf-8') as f:
    f.write(comp)
