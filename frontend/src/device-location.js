import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
const failure=(error,fail)=>fail?.({code:/denied|permission/i.test(error?.message||'')?1:2,message:error?.message||'Location unavailable'});
export const deviceLocation=Capacitor.isNativePlatform()?{
 getCurrentPosition(success,fail,options){Geolocation.requestPermissions().then(()=>Geolocation.getCurrentPosition(options)).then(success).catch(e=>failure(e,fail));},
 watchPosition(success,fail,options){
  const handle={id:null,cancelled:false};
  Geolocation.requestPermissions().then(()=>{if(handle.cancelled)return;return Geolocation.watchPosition(options,(position,error)=>{if(handle.cancelled)return;if(error)failure(error,fail);else if(position)success(position);});}).then(id=>{handle.id=id;if(id&&handle.cancelled)Geolocation.clearWatch({id}).catch(()=>{});}).catch(e=>{if(!handle.cancelled)failure(e,fail);});
  return handle;
 },
 clearWatch(handle){if(!handle)return;handle.cancelled=true;if(handle.id)Geolocation.clearWatch({id:handle.id}).catch(()=>{});}
}:navigator.geolocation;
