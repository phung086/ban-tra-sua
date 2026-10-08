import type * as T from 'three';
import type {QualityProfile} from './renderQuality';
export interface SceneRenderer {
  readonly canvas:HTMLCanvasElement;
  readonly name:string;
  readonly info:{calls:number;triangles:number};
  resize(width:number,height:number):void;
  quality(profile:QualityProfile):void;
  render(scene:T.Scene,camera:T.PerspectiveCamera):void;
  dispose():void;
}
export type RendererFactory=(scene:T.Scene,camera:T.PerspectiveCamera,profile:QualityProfile)=>SceneRenderer;
