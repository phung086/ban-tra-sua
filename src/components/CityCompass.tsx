import type {Position} from '../game/service';
import {CityMapDrawing} from './CityMapDrawing';
export function CityCompass({position,onOpen}:{position:Position;onOpen:()=>void}){
  return <button className="city-compass" onClick={onOpen} aria-label="Mở bản đồ khu phố"><CityMapDrawing position={position} wide={Math.abs(position.x)>37||position.z<-46}/><span>Bản đồ thành phố</span></button>;
}
