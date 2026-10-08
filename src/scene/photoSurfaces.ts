type PhotoSurface = {albedo:HTMLCanvasElement; normal:HTMLCanvasElement};
const photos = new Map<string,PhotoSurface>();
let loading:Promise<void>|undefined;

// Bundled CC0 photographs; decoding and downsampling happen before either
// renderer reads the scene. GPU allocations belong to each scene Workshop.
export function photographicSurface(kind:string){return photos.get(kind);}
export function loadPhotographicSurfaces():Promise<void>{
  if(typeof document==='undefined')return Promise.resolve();
  if(loading)return loading;
  const load=(name:string)=>new Promise<HTMLCanvasElement>((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>{
      const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
      const context=canvas.getContext('2d');
      if(!context){reject(new Error('Canvas unavailable'));return;}
      context.drawImage(image,0,0,512,512);resolve(canvas);
    };
    image.onerror=()=>reject(new Error(`Material unavailable: ${name}`));
    image.src=`${import.meta.env.BASE_URL}textures/${name}.jpg`;
  });
  loading=Promise.allSettled(['paving','bark','asphalt','roof'].map(async kind=>{
    const [albedo,normal]=await Promise.all([load(`${kind}-albedo`),load(`${kind}-normal`)]);
    photos.set(kind,{albedo,normal});
  })).then(()=>undefined);
  return loading;
}
