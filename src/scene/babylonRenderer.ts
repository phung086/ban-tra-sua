import * as T from 'three';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera';
import {Vector3,Quaternion,Matrix} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {Geometry} from '@babylonjs/core/Meshes/geometry';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import {Material} from '@babylonjs/core/Materials/material';
import {Texture} from '@babylonjs/core/Materials/Textures/texture';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {RawCubeTexture} from '@babylonjs/core/Materials/Textures/rawCubeTexture';
import {Constants} from '@babylonjs/core/Engines/constants';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import {SceneInstrumentation} from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import {Bone} from '@babylonjs/core/Bones/bone';
import {nativeSkeleton,syncNativeBones} from './babylonSkeleton';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
// Register complete shader sources in this deferred renderer chunk. Missing
// sources otherwise fall back to fetching .fx URLs (the SPA HTML on Vite).
import '@babylonjs/core/Shaders/shadowMap.vertex';
import '@babylonjs/core/Shaders/shadowMap.fragment';
import '@babylonjs/core/Shaders/pbr.vertex';
import '@babylonjs/core/Shaders/pbr.fragment';
import '@babylonjs/core/Shaders/postprocess.vertex';
import '@babylonjs/core/Shaders/rgbdDecode.fragment';
import type {SceneRenderer} from './renderDriver';
import type {QualityProfile} from './renderQuality';

type Binding={source:T.Mesh|T.Points;mesh:Mesh;matrix:Matrix;last:number[];positionVersion:number;bones?:Bone[]};
// Three.js remains the content/animation graph. Babylon owns this canvas and GPU
// exclusively. Geometry, materials and textures are shared; only changed matrices
// and live particle buffers are uploaded after the initial conversion.
export class BabylonSceneRenderer implements SceneRenderer {
  name='Babylon.js';canvas=document.createElement('canvas');
  engine:Engine;scene:Scene;camera:FreeCamera;sun:DirectionalLight;ambient:HemisphericLight;
  shadow:ShadowGenerator;instrumentation:SceneInstrumentation;
  bindings=new Map<number,Binding>();geometries=new Map<number,Geometry>();materials=new Map<string,PBRMaterial>();textures=new Map<number,DynamicTexture>();
  info={calls:0,triangles:0}; width=1;height=1;rootCount=-1;profile:QualityProfile;
  direction=new Vector3();origin=new Vector3();
  constructor(source:T.Scene,_camera:T.PerspectiveCamera,profile:QualityProfile){
    this.profile=profile;
    this.engine=new Engine(this.canvas,true,{preserveDrawingBuffer:false,stencil:false,powerPreference:'default'},false);
    this.scene=new Scene(this.engine);this.scene.useRightHandedSystem=true;
    this.scene.skipPointerMovePicking=true;this.scene.autoClear=true;
    this.camera=new FreeCamera('player-camera',new Vector3(),this.scene);this.camera.minZ=0.08;this.camera.maxZ=180;
    this.camera.rotationQuaternion=new Quaternion();
    this.sun=new DirectionalLight('afternoon-sun',new Vector3(-0.4,-1,-0.35),this.scene);
    this.ambient=new HemisphericLight('sky-light',new Vector3(0,1,0),this.scene);
    this.ambient.groundColor=Color3.FromHexString('#94747c').toLinearSpace();
    this.shadow=new ShadowGenerator(profile.shadowSize,this.sun);this.shadow.usePercentageCloserFiltering=true;
    this.shadow.filteringQuality=ShadowGenerator.QUALITY_LOW;this.shadow.bias=0.003;this.shadow.normalBias=0.08;this.shadow.forceBackFacesOnly=true;
    this.scene.imageProcessingConfiguration.toneMappingEnabled=true;
    this.scene.imageProcessingConfiguration.toneMappingType=1;this.scene.imageProcessingConfiguration.exposure=1;
    this.scene.imageProcessingConfiguration.contrast=1.1;
    // Small procedural sky cube: no remote assets, probes or per-frame reflection.
    const faces=Array.from({length:6},(_,face)=>{
      const pixels=new Uint8Array(32*32*3);
      for(let y=0;y<32;y++)for(let x=0;x<32;x++){
        const t=face===2?0:face===3?1:y/31,i=(y*32+x)*3;
        pixels[i]=150+Math.round(t*65);pixels[i+1]=190+Math.round(t*20);pixels[i+2]=210-Math.round(t*20);
      }return pixels;
    });
    this.scene.environmentTexture=new RawCubeTexture(this.scene,faces,32,Constants.TEXTUREFORMAT_RGB,Constants.TEXTURETYPE_UNSIGNED_BYTE,true,false);
    this.scene.environmentIntensity=0.3;
    this.instrumentation=new SceneInstrumentation(this.scene);
    this.quality(profile);this.syncObjects(source);
  }
  texture(source:T.Texture){
    const cached=this.textures.get(source.id);if(cached)return cached;
    const image=source.image as HTMLCanvasElement;
    const texture=new DynamicTexture(source.name||'authored-surface',{width:image.width,height:image.height},this.scene,true);
    texture.getContext().drawImage(image,0,0);texture.update(true);
    texture.gammaSpace=source.colorSpace===T.SRGBColorSpace;texture.hasAlpha=true;texture.anisotropicFilteringLevel=4;
    texture.uScale=source.repeat.x;texture.vScale=source.repeat.y;
    texture.wrapU=source.wrapS===T.RepeatWrapping?Texture.WRAP_ADDRESSMODE:Texture.CLAMP_ADDRESSMODE;
    texture.wrapV=source.wrapT===T.RepeatWrapping?Texture.WRAP_ADDRESSMODE:Texture.CLAMP_ADDRESSMODE;
    this.textures.set(source.id,texture);return texture;
  }
  material(source:T.Material){
    const cached=this.materials.get(source.uuid);if(cached)return cached;
    const original=source as T.MeshStandardMaterial,material=new PBRMaterial(source.name||`surface-${source.uuid}`,this.scene);
    const color=original.color??new T.Color('white');material.albedoColor=new Color3(color.r,color.g,color.b);
    material.metallic=original.metalness??0;material.roughness=original.roughness??0.8;
    material.alpha=source.opacity;material.backFaceCulling=source.side!==T.DoubleSide;
    material.sideOrientation=Material.CounterClockWiseSideOrientation;
    if(original.map){material.albedoTexture=this.texture(original.map);material.useAlphaFromAlbedoTexture=source.transparent;}
    if(original.normalMap){material.bumpTexture=this.texture(original.normalMap);material.bumpTexture.level=original.normalScale?.x??.45;}
    if(source.alphaTest>0){material.transparencyMode=PBRMaterial.PBRMATERIAL_ALPHATEST;material.alphaCutOff=source.alphaTest;}
    if(original.emissive)material.emissiveColor=new Color3(original.emissive.r,original.emissive.g,original.emissive.b);
    if(source.transparent)material.transparencyMode=PBRMaterial.PBRMATERIAL_ALPHABLEND;
    this.materials.set(source.uuid,material);return material;
  }
  syncObjects(source:T.Scene){
    this.rootCount=source.children.length;
    source.traverse(object=>{
      if(!(object instanceof T.Mesh||object instanceof T.Points)||this.bindings.has(object.id))return;
      const mesh=new Mesh(object.name||`object-${object.id}`,this.scene);
      let geometry=this.geometries.get(object.geometry.id);
      if(!geometry){
        const data=new VertexData(),position=object.geometry.getAttribute('position');
        data.positions=new Float32Array(position.array);
        const normal=object.geometry.getAttribute('normal'),uv=object.geometry.getAttribute('uv');
        if(normal)data.normals=new Float32Array(normal.array);
        if(uv)data.uvs=new Float32Array(uv.array);
        const color=object.geometry.getAttribute('color');if(color){const rgba=new Float32Array(color.count*4);for(let i=0;i<color.count;i++){rgba[i*4]=color.getX(i);rgba[i*4+1]=color.getY(i);rgba[i*4+2]=color.getZ(i);rgba[i*4+3]=1;}data.colors=rgba;}
        if(object instanceof T.SkinnedMesh){data.matricesIndices=Array.from(object.geometry.getAttribute('skinIndex').array);data.matricesWeights=Array.from(object.geometry.getAttribute('skinWeight').array);}
        data.indices=object.geometry.index?Array.from(object.geometry.index.array):Array.from({length:position.count},(_,i)=>i);
        geometry=new Geometry(`geometry-${object.geometry.id}`,this.scene,data,object instanceof T.Points);
        this.geometries.set(object.geometry.id,geometry);
      }
      geometry.applyToMesh(mesh);mesh.material=this.material(Array.isArray(object.material)?object.material[0]:object.material);
      mesh.receiveShadows=object instanceof T.Mesh&&object.receiveShadow;mesh.isPickable=false;
      if(object instanceof T.InstancedMesh)mesh.thinInstanceSetBuffer('matrix',new Float32Array(object.instanceMatrix.array),16,true);
      if(object instanceof T.Points){const mat=mesh.material as PBRMaterial;mat.pointsCloud=true;mat.pointSize=2;mat.disableLighting=true;}
      let bones:Bone[]|undefined;
      if(object instanceof T.SkinnedMesh){
        const converted=nativeSkeleton(object,this.scene);bones=converted.bones;
        mesh.skeleton=converted.skeleton;mesh.numBoneInfluencers=4;
      }
      this.bindings.set(object.id,{source:object,mesh,matrix:Matrix.Identity(),last:[],positionVersion:-1,bones});
    });
  }
  quality(profile:QualityProfile){
    this.profile=profile;
    this.engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio,profile.pixelRatio));
    this.shadow.mapSize=profile.shadowSize;
    this.resize(this.width,this.height);
  }
  resize(width:number,height:number){this.width=width;this.height=height;this.engine.setSize(Math.round(width*Math.min(devicePixelRatio,this.profile.pixelRatio)),Math.round(height*Math.min(devicePixelRatio,this.profile.pixelRatio)));}
  render(source:T.Scene,camera:T.PerspectiveCamera){
    source.updateMatrixWorld();
    if(this.rootCount!==source.children.length)this.syncObjects(source);
    this.camera.position.set(camera.position.x,camera.position.y,camera.position.z);
    this.camera.rotationQuaternion!.set(camera.quaternion.x,camera.quaternion.y,camera.quaternion.z,camera.quaternion.w);
    this.camera.fov=camera.fov*Math.PI/180;
    this.camera.maxZ=camera.far;
    const sky=source.background as T.Color;
    if(sky?.isColor)this.scene.clearColor=new Color4(sky.r,sky.g,sky.b,1);
    const fog=source.fog as T.Fog;
    if(fog){this.scene.fogMode=Scene.FOGMODE_LINEAR;this.scene.fogStart=fog.near;this.scene.fogEnd=fog.far;this.scene.fogColor=new Color3(fog.color.r,fog.color.g,fog.color.b);}
    const sun=source.children.find(o=>o instanceof T.DirectionalLight) as T.DirectionalLight;
    if(sun){
      this.sun.position.set(sun.position.x,sun.position.y,sun.position.z);
      this.sun.direction.set(sun.target.position.x-sun.position.x,sun.target.position.y-sun.position.y,sun.target.position.z-sun.position.z).normalize();
      this.sun.intensity=sun.intensity;this.sun.diffuse.set(sun.color.r,sun.color.g,sun.color.b);
      this.sun.shadowMinZ=1;this.sun.shadowMaxZ=100;
      this.sun.autoUpdateExtends=false;
      this.sun.orthoLeft=sun.shadow.camera.left;this.sun.orthoRight=sun.shadow.camera.right;
      this.sun.orthoTop=sun.shadow.camera.top;this.sun.orthoBottom=sun.shadow.camera.bottom;
    }
    const ambient=source.children.find(o=>o instanceof T.HemisphereLight) as T.HemisphereLight;
    if(ambient)this.ambient.intensity=ambient.intensity*1.25;
    const casters:Mesh[]=[];
    this.bindings.forEach(binding=>{
      const {source:object,mesh,matrix,last}=binding;
      let visible=true,attached=false;
      for(let node:T.Object3D|null=object;node;node=node.parent){if(!node.visible)visible=false;if(node===source){attached=true;break;}}
      if(!attached){mesh.skeleton?.dispose();mesh.dispose(false,false);this.bindings.delete(object.id);return;}
      mesh.setEnabled(visible);
      if(visible&&object instanceof T.SkinnedMesh&&binding.bones)syncNativeBones(object,binding.bones);
      if(!visible)return;
      const elements=object.matrixWorld.elements;
      if(elements.some((value,i)=>value!==last[i])){Matrix.FromArrayToRef(elements,0,matrix);mesh.freezeWorldMatrix(matrix);binding.last=elements.slice();}
      const bounds=mesh.getBoundingInfo().boundingSphere,center=bounds.centerWorld;
      if(object instanceof T.Mesh&&object.castShadow&&Math.hypot(center.x-camera.position.x,center.z-camera.position.z)<30+bounds.radiusWorld)casters.push(mesh);
      const mat=object.material as T.MeshStandardMaterial;
      if(!Array.isArray(object.material))mesh.material=this.material(object.material);
      const target=mesh.material as PBRMaterial;
      if(mat.emissive)target.emissiveColor.set(mat.emissive.r,mat.emissive.g,mat.emissive.b);
      if(object instanceof T.Points){const position=object.geometry.getAttribute('position') as T.BufferAttribute;if(position.version!==binding.positionVersion){mesh.updateVerticesData('position',position.array as Float32Array);binding.positionVersion=position.version;}}
    });
    this.shadow.getShadowMap()!.renderList=casters;
    this.scene.render();
    this.info.calls=this.instrumentation.drawCallsCounter.current;
    this.info.triangles=Math.round(this.scene.getActiveIndices()/3);
  }
  dispose(){this.instrumentation.dispose();this.scene.dispose();this.engine.dispose();this.bindings.clear();this.geometries.clear();this.materials.clear();this.textures.clear();}
}
