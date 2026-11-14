export function point(value,optional=false){
 if(optional&&(!value||(String(value.lat??'').trim()===''&&String(value.lng??'').trim()==='')))return null;
 if(!value||String(value.lat??'').trim()===''||String(value.lng??'').trim()==='')throw Error('Enter both latitude and longitude.');
 const lat=Number(value.lat),lng=Number(value.lng);
 if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180)throw Error('Latitude must be −90 to 90 and longitude −180 to 180.');
 return {lat,lng};
}
export function canDrive(o,user){return user?.role==='delivery'&&o.assigned_to===user.email.toLowerCase()&&o.delivery_request?.status==='Accepted'&&!['Placed','Cancelled','Delivered'].includes(o.status);}
function owner(user){if(user?.role!=='admin')throw Error('Owner access required');}
function history(o,note,actor){o.history??=[];o.history.push({status:o.status,note,actor,at:Date.now()/1000});}
export function sendRequest(o,user,body,partners=['delivery@demo.com']){
 owner(user);if(o.status!=='Confirmed')throw Error('Confirm the order before sending a delivery request. Requests can only be replaced before shipping.');
 if(o.delivery_request&&['Pending','Accepted'].includes(o.delivery_request.status))throw Error('Withdraw the existing request before sending another one.');
 if(!partners.map(p=>p.toLowerCase()).includes(String(body.assigned_to||'').toLowerCase()))throw Error('Choose an available delivery partner.');body.assigned_to=String(body.assigned_to).toLowerCase();
 const pickup=point(body.pickup,true),dropoff=point(body.dropoff,true); // map pins are optional; addresses are enough
 const pickupAddress=String(body.pickup_address||'').trim();if(pickupAddress.length<5||pickupAddress.length>500)throw Error('Enter a pickup address in 5–500 characters.');
 if(!String(o.address||'').trim())throw Error('This order needs a delivery address before dispatch.');
 o.locations={pickup:{...pickup,label:pickupAddress},dropoff:{...dropoff,label:o.address}};
 o.delivery_request={id:'REQUEST-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),status:'Pending',created_at:Date.now()/1000,note:String(body.note||'Please collect this order from the shop.').trim().slice(0,500)};
 o.assigned_to=body.assigned_to;o.driver_location=null;o.location_trail=[];history(o,'Delivery request sent to '+o.assigned_to,'Shop owner');return o;
}
export function respondRequest(o,user,body){
 if(user?.role!=='delivery'||o.assigned_to!==user.email.toLowerCase())throw Error('This delivery request is not assigned to you.');
 if(o.status!=='Confirmed'||o.delivery_request?.status!=='Pending')throw Error('This request is no longer pending.');
 if(body.request_id!==o.delivery_request.id)throw Error('This request has changed. Refresh and try again.');
 if(!['Accepted','Declined'].includes(body.decision))throw Error('Choose Accept or Decline.');
 o.delivery_request.status=body.decision;o.delivery_request.responded_at=Date.now()/1000;o.delivery_request.response_note=String(body.note||'').trim().slice(0,500);
 history(o,'Delivery request '+body.decision.toLowerCase()+(body.note?': '+String(body.note).slice(0,500):''),'Delivery partner');return o;
}
export function withdrawRequest(o,user){owner(user);if(o.status!=='Confirmed'||!['Pending','Accepted'].includes(o.delivery_request?.status))throw Error('Only a pending or accepted request can be withdrawn before shipping.');o.delivery_request.status='Withdrawn';o.delivery_request.responded_at=Date.now()/1000;o.driver_location=null;history(o,'Delivery request withdrawn','Shop owner');return o;}
export function shareLocation(o,user,body){
 if(!canDrive(o,user))throw Error('Accept the assigned request before sharing location. Finished deliveries cannot share location.');
 if(body.request_id!==o.delivery_request.id)throw Error('Delivery request changed. Location sharing stopped.');
 const p=point(body);if(body.accuracy!=null&&(!Number.isFinite(Number(body.accuracy))||Number(body.accuracy)<0))throw Error('Invalid GPS accuracy.');
 o.driver_location={...p,accuracy:body.accuracy==null?null:Number(body.accuracy),at:Date.now()/1000,source:body.source==='manual'?'manual':'gps'};
 o.location_trail=[...(o.location_trail||[]),o.driver_location].slice(-40);return o;
}
export function distanceKm(a,b){const rad=n=>n*Math.PI/180;const dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),h=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));}
