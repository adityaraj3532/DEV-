import L from 'leaflet';
window.L=L;
let baseReady;
function addStreetLayer(map,element){
 const note=document.createElement('p');note.className='muted map-load-status';note.textContent='Loading street map…';element.after(note);
 baseReady??=import('leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js').then(async()=>{const response=await fetch('https://tiles.openfreemap.org/planet');if(!response.ok)throw Error('Street map unavailable');return response.json();});
 let layer,removed=false;
 baseReady.then(meta=>{if(removed)return;layer=L.vectorGrid.protobuf(meta.tiles[0],{rendererFactory:L.canvas.tile,interactive:true,maxNativeZoom:meta.maxzoom||14,maxZoom:19,vectorTileLayerStyles:{water:{fill:true,fillColor:'#c8e4f4',fillOpacity:1,stroke:false},waterway:{color:'#b6d8ed',weight:1},water_name:[],landcover:{fill:true,fillColor:'#e5eddf',fillOpacity:0.5,stroke:false},landuse:{fill:true,fillColor:'#f0eee8',fillOpacity:0.7,stroke:false},park:{fill:true,fillColor:'#dbe9d2',fillOpacity:0.7,stroke:false},building:{fill:true,fillColor:'#e2ddd4',fillOpacity:0.8,color:'#d3cfc6',weight:0.3},boundary:{color:'#b1b7c5',weight:1,dashArray:'4 4'},transportation:properties=>({color:['motorway','trunk','primary'].includes(properties.class)?'#d4ae74':'#bac3ce',weight:['motorway','trunk','primary'].includes(properties.class)?2.6:1.3,opacity:0.9,fill:false}),transportation_name:[],aeroway:{color:'#b4bac4',weight:2},aerodrome_label:[],housenumber:[],mountain_peak:[],place:[],poi:[]}}).addTo(map);
 layer.on('load',()=>{note.textContent='Street map · zoom in for road detail. Tap a road for its name.';});layer.on('tileerror',()=>{note.textContent='Street tiles could not load. Position pins still work; check your internet connection.';});layer.on('click',e=>{const label=e.layer?.properties?.name;if(label){const content=document.createElement('span');content.textContent=label;L.popup().setLatLng(e.latlng).setContent(content).openOn(map);}});
 }).catch(()=>{if(!removed)note.textContent='Street map unavailable. Position pins still work; check your internet connection.';});
 map.attributionControl.addAttribution('<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> © OpenMapTiles · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>');
 return ()=>{removed=true;note.remove();};
}
export function createDeliveryMap(element,{pickup,dropoff,driver,trail=[],onPick}={}){
 const map=L.map(element,{scrollWheelZoom:false}).setView([22.9,79.2],4),markers=L.layerGroup().addTo(map);
 const cleanup=addStreetLayer(map,element);
 let fitted=false;
 function update(points){markers.clearLayers();const bounds=[];for(const [name,p,color] of [['Pickup',points.pickup,'#4661a6'],['Delivery address',points.dropoff,'#087f70'],['Delivery partner (last reported)',points.driver,'#d75313']])if(p){const marker=L.circleMarker([p.lat,p.lng],{radius:9,color:'#fff',weight:3,fillColor:color,fillOpacity:1}).addTo(markers);marker.bindTooltip(name);bounds.push([p.lat,p.lng]);}
 const track=(points.trail||[]).map(p=>[p.lat,p.lng]);if(track.length>1)L.polyline(track,{color:'#d75313',weight:3}).addTo(markers);
 if(points.driver&&points.dropoff)L.polyline([[points.driver.lat,points.driver.lng],[points.dropoff.lat,points.dropoff.lng]],{color:'#65758b',dashArray:'6 8',weight:2}).addTo(markers);
 if(bounds.length&&!fitted){map.fitBounds(bounds,{padding:[35,35],maxZoom:15});fitted=true;}
 }
 if(onPick)map.on('click',e=>onPick({lat:+e.latlng.lat.toFixed(6),lng:+e.latlng.lng.toFixed(6)}));
 update({pickup,dropoff,driver,trail});setTimeout(()=>map.invalidateSize(),50);
 return {update,remove:()=>{cleanup();map.remove();}};
}
