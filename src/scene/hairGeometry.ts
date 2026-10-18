import * as T from 'three';

export type HairStyle='bob'|'short'|'bun'|'long'|'bald';
/** One scalp-following surface, with a varying hairline rather than stacked balls. */
export function hairGeometry(style:HairStyle){
  const columns=32,rows=18,positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    const phi=col/columns*Math.PI*2,front=Math.max(0,Math.cos(phi));
    const back=1-front;
    const lower=style==='bob'||style==='long'?2.42:style==='bald'?1.62:1.88;
    const hairline=lower-(lower-1.13)*front**3+.045*Math.sin(phi*3)*front;
    const theta=row/rows*hairline;
    const y=Math.cos(theta)*.283;
    const length=style==='long'&&y<0?1+back*.8:1;
    positions.push(Math.sin(phi)*Math.sin(theta)*.223,y*length+.018,
      Math.cos(phi)*Math.sin(theta)*.207-.016);
    uv.push(col/columns,row/rows);
    if(row<rows&&col<columns){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  const normals=g.getAttribute('normal');
  for(let row=1;row<=rows;row++){
    const a=row*(columns+1),b=a+columns;
    const n=new T.Vector3().fromBufferAttribute(normals,a).add(new T.Vector3().fromBufferAttribute(normals,b)).normalize();
    normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);
  }
  for(let col=0;col<=columns;col++)normals.setXYZ(col,0,1,0);
  return g;
}
