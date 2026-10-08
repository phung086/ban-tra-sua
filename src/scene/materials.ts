import * as T from 'three';
import {photographicSurface} from './photoSurfaces';
export type SurfaceKind='wood'|'stone'|'fabric'|'plaster'|'brick'|'paving'|'asphalt'|'bark'|'roof'|'foliage';
// Authored, deterministic albedo + tangent-space normals. Shared GPU resources;
// paving detail stays in the material rather than creating a mesh per brick.
export function makeSurface(kind:SurfaceKind,color:string,textures:T.Texture[]) {
  if(typeof document==='undefined')return new T.MeshStandardMaterial({color,roughness:.9});
  const photo=photographicSurface(kind);
  if(photo){
    const map=new T.CanvasTexture(photo.albedo),normalMap=new T.CanvasTexture(photo.normal);
    map.colorSpace=T.SRGBColorSpace;
    for(const texture of [map,normalMap]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;textures.push(texture);}
    const tint=new T.Color(color).lerp(new T.Color('#ffffff'),.72);
    return new T.MeshStandardMaterial({color:tint,map,normalMap,normalScale:new T.Vector2(.65,.65),roughness:kind==='roof'?.86:.95});
  }
  const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d')!,base=new T.Color(color).getHex();
  const rgb=[base>>16&255,base>>8&255,base&255],data=ctx.createImageData(size,size),heights=new Float32Array(size*size);
  const hash=(x:number,y:number)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,grain=hash(x,y),coarse=hash(Math.floor(x/28),Math.floor(y/28));let shade=1+(grain-.5)*.13,h=grain*.07;
    if(kind==='brick'||kind==='paving'){
      const row=Math.floor(y/64),xx=(x+(row%2)*64)%128,yy=y%64,mortar=xx<4||yy<4;
      const tile=hash(Math.floor((x+(row%2)*64)/128),row);
      shade=mortar?.61:.91+tile*.18+(grain-.5)*.09;h=mortar?.1:.7+grain*.04;
      if(xx>119||yy>56){shade*=.9;h-=.08;}
    }else if(kind==='wood'||kind==='bark'){
      const grainLine=Math.sin(x*.21+Math.sin(y*.013)*2+Math.sin(x*.07)*1.2);
      shade+=grainLine*(kind==='bark'?.2:.1)+Math.sin(x*.67+y*.01)*.045;h+=grainLine*.16;
      if(kind==='wood'&&x%128<3){shade*=.5;h=.05;}
    }else if(kind==='asphalt'){shade=.9+grain*.17;h=grain*.09;if(grain>.985){shade=1.3;h=.16;}}
    else if(kind==='fabric'){shade+=((x%4===0||y%4===0)?-.13:.035);h+=(x%4===0||y%4===0)?0:.16;}
    else if(kind==='roof'){const roll=Math.cos(x/32*Math.PI*2);shade+=roll*.2;h+=roll*.3;if(y%96<4){shade*=.58;h=.03;}}
    else if(kind==='foliage'){shade=.8+coarse*.3+(grain-.5)*.18;h=grain*.08;}
    else {shade+=(coarse-.5)*.075;h=grain*.11;}
    heights[i]=h;data.data[i*4]=Math.min(255,rgb[0]*shade);data.data[i*4+1]=Math.min(255,rgb[1]*shade);data.data[i*4+2]=Math.min(255,rgb[2]*shade);data.data[i*4+3]=255;
  }
  ctx.putImageData(data,0,0);
  // Water streaks, aggregate and tiny chips belong to the actual material.
  if(kind==='plaster')for(let i=0;i<32;i++){ctx.fillStyle=i%2?'#53604b0c':'#fff8ed12';ctx.fillRect(hash(i,3)*size,hash(i,8)*size,3+hash(i,5)*18,12+hash(i,9)*72);}
  const normal=document.createElement('canvas');normal.width=normal.height=size;const nc=normal.getContext('2d')!,nd=nc.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,dx=heights[y*size+(x+1)%size]-heights[y*size+(x+size-1)%size],dy=heights[((y+1)%size)*size+x]-heights[((y+size-1)%size)*size+x],length=Math.hypot(dx*1.8,dy*1.8,1);
    nd.data[i*4]=(-dx*1.8/length*.5+.5)*255;nd.data[i*4+1]=(-dy*1.8/length*.5+.5)*255;nd.data[i*4+2]=(1/length*.5+.5)*255;nd.data[i*4+3]=255;
  }nc.putImageData(nd,0,0);
  const map=new T.CanvasTexture(canvas),normalMap=new T.CanvasTexture(normal);map.colorSpace=T.SRGBColorSpace;
  for(const texture of [map,normalMap]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;textures.push(texture);}
  return new T.MeshStandardMaterial({map,normalMap,normalScale:new T.Vector2(.45,.45),roughness:kind==='stone'?.72:kind==='wood'?.78:.94});
}
