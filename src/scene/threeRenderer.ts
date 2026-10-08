import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type {SceneRenderer} from './renderDriver';
import type {QualityProfile} from './renderQuality';
export class ThreeSceneRenderer implements SceneRenderer {
  renderer:T.WebGLRenderer;
  environment:T.WebGLRenderTarget;
  name='Three.js';
  width=1;height=1;
  shadowInterval=70;lastShadow=-Infinity;
  constructor(scene:T.Scene,_camera:T.PerspectiveCamera,profile:QualityProfile){
    this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'default'});
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;this.renderer.shadowMap.autoUpdate=false;
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1;
    const pmrem=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();
    this.environment=pmrem.fromScene(room,0.04);scene.environment=this.environment.texture;
    scene.environmentIntensity=0.26;room.dispose();pmrem.dispose();this.quality(profile);
  }
  get canvas(){return this.renderer.domElement;}
  get info(){return {calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles};}
  resize(width:number,height:number){this.width=width;this.height=height;this.renderer.setSize(width,height,false);}
  quality(profile:QualityProfile){
    this.shadowInterval=profile.id==='high'?70:profile.id==='balanced'?100:150;
    this.lastShadow=-Infinity;
    // Low-end mobile keeps contact/blob shadows, but omits costly real-time
    // directional shadow passes. Balanced/high retain their previous shadows.
    this.renderer.shadowMap.enabled=profile.id!=='light';
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,profile.pixelRatio));
    this.resize(this.width,this.height);
  }
  render(scene:T.Scene,camera:T.PerspectiveCamera){
    const now=performance.now();if(this.renderer.shadowMap.enabled&&now-this.lastShadow>=this.shadowInterval){this.renderer.shadowMap.needsUpdate=true;this.lastShadow=now;}
    this.renderer.render(scene,camera);
  }
  dispose(){this.environment.dispose();this.renderer.dispose();this.renderer.forceContextLoss();}
}
