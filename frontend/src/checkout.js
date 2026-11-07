// Checkout: delivery address, payment method and order summary.
// Rendering takes a context object from local-app.js so this file stays independent of app internals.

export const INDIAN_STATES=['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
export const FREE_DELIVERY_FROM=100000,DELIVERY_FEE=4900; // paise

export const PAYMENT_METHODS=[
 {id:'COD',title:'Cash on delivery',note:'Pay in cash or UPI when the order arrives.',online:false},
 {id:'UPI',title:'UPI',note:'Google Pay, PhonePe, Paytm, BHIM and other UPI apps.',online:true},
 {id:'Card',title:'Debit / credit card',note:'Visa, Mastercard, RuPay.',online:true},
 {id:'Net banking',title:'Net banking',note:'All major Indian banks.',online:true}
];

/** Trims and validates a structured address. Returns {address, errors}. */
export function validateAddress(raw){
 const a={},errors={};
 for(const k of ['label','name','phone','line','landmark','city','state','pin'])a[k]=String(raw?.[k]??'').trim().replace(/\s+/g,' ');
 a.phone=a.phone.replace(/^(\+91|0)/,'').replace(/[\s-]/g,'');
 if(a.name.length<2)errors.name='Enter the full name of the person receiving the order.';
 if(!/^[6-9]\d{9}$/.test(a.phone))errors.phone='Enter a valid 10-digit Indian mobile number.';
 if(a.line.length<5)errors.line='Enter flat / house number, building and street.';
 if(a.city.length<2)errors.city='Enter your city or town.';
 if(!INDIAN_STATES.includes(a.state))errors.state='Choose your state.';
 if(!/^[1-9]\d{5}$/.test(a.pin))errors.pin='Enter a valid 6-digit PIN code.';
 if(a.landmark.length>120)errors.landmark='Keep the landmark under 120 characters.';
 a.label=a.label||'Home';
 return {address:a,errors};
}

export function formatAddress(a){return `${a.line}${a.landmark?', near '+a.landmark:''}, ${a.city}, ${a.state} ${a.pin}`;}

export function orderTotals(items,products){
 let subtotal=0,count=0;const lines=[];
 for(const i of items){const p=products.find(p=>p.id===i.product_id&&p.active);if(!p)continue;lines.push({product:p,quantity:i.quantity,total:p.price_paise*i.quantity});subtotal+=p.price_paise*i.quantity;count+=i.quantity;}
 const delivery=subtotal&&subtotal<FREE_DELIVERY_FROM?DELIVERY_FEE:0;
 return {lines,subtotal,delivery,total:subtotal+delivery,count};
}

const field=(esc,name,label,input,hint='')=>`<div class="co-field" data-field="${name}"><label for="co-${name}">${label}</label>${input}${hint?`<small class="co-hint">${hint}</small>`:''}<small class="co-error" id="co-${name}-error" role="alert"></small></div>`;

/** Address inputs shared by checkout and the saved-address editor. */
export function addressFields(esc,a={}){
 const v=k=>esc(a[k]??'');
 return `<div class="co-chips" role="radiogroup" aria-label="Address type">${['Home','Work','Other'].map(t=>`<label class="co-chip"><input type="radio" name="label" value="${t}" ${(a.label||'Home')===t?'checked':''}><span>${t}</span></label>`).join('')}</div>
 <div class="co-grid">
 ${field(esc,'name','Full name',`<input id="co-name" name="name" autocomplete="name" maxlength="120" value="${v('name')}" aria-describedby="co-name-error">`)}
 ${field(esc,'phone','Mobile number',`<div class="co-prefix"><span>+91</span><input id="co-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" value="${v('phone')}" aria-describedby="co-phone-error"></div>`,'Used by the delivery partner to reach you.')}
 </div>
 ${field(esc,'line','Flat / house no., building, street, area',`<input id="co-line" name="line" autocomplete="street-address" maxlength="300" value="${v('line')}" aria-describedby="co-line-error">`)}
 ${field(esc,'landmark','Landmark <span class="co-optional">(optional)</span>',`<input id="co-landmark" name="landmark" maxlength="120" placeholder="e.g. opposite City Mall" value="${v('landmark')}">`)}
 <div class="co-grid co-grid-3">
 ${field(esc,'pin','PIN code',`<input id="co-pin" name="pin" inputmode="numeric" autocomplete="postal-code" maxlength="6" value="${v('pin')}" aria-describedby="co-pin-error">`)}
 ${field(esc,'city','City / town',`<input id="co-city" name="city" autocomplete="address-level2" maxlength="80" value="${v('city')}" aria-describedby="co-city-error">`)}
 ${field(esc,'state','State',`<select id="co-state" name="state" autocomplete="address-level1" aria-describedby="co-state-error"><option value="">Select state</option>${INDIAN_STATES.map(s=>`<option ${a.state===s?'selected':''}>${s}</option>`).join('')}</select>`)}
 </div>`;
}

/** Shows field errors; returns true when there are none. */
export function showErrors(form,errors){
 form.querySelectorAll('.co-field').forEach(el=>{const msg=errors[el.dataset.field]||'';el.classList.toggle('invalid',!!msg);el.querySelector('.co-error').textContent=msg;el.querySelector('input,select')?.setAttribute('aria-invalid',msg?'true':'false');});
 const first=form.querySelector('.co-field.invalid input,.co-field.invalid select');if(first)first.focus();
 return !first;
}

/** Live clean-up of phone/PIN input and per-field validation on blur. */
export function wireAddressInputs(form){
 const digits=(name,max)=>{const el=form.querySelector(`[name="${name}"]`);if(el)el.addEventListener('input',()=>{const d=el.value.replace(/\D/g,'').slice(-max);if(d!==el.value)el.value=d;});};
 digits('phone',10);digits('pin',6);
 form.querySelectorAll('.co-field input,.co-field select').forEach(el=>el.addEventListener('blur',()=>{if(!el.value&&el.name==='landmark')return;const {errors}=validateAddress(Object.fromEntries(new FormData(form)));const box=el.closest('.co-field'),msg=el.value?errors[el.name]||'':'';box.classList.toggle('invalid',!!msg);box.querySelector('.co-error').textContent=msg;}));
}

function summary(ctx,t){
 const {esc,money}=ctx;
 return `<aside class="co-summary card" aria-label="Order summary"><h3>Order summary <span class="muted">· ${t.count} item${t.count===1?'':'s'}</span></h3>
 <ul class="co-items">${t.lines.map(l=>`<li><span class="co-thumb">${ctx.itemVisual(l.product)}<b>${l.quantity}</b></span><span class="co-item-name">${esc(l.product.name)}<small>${esc(ctx.returnLabel(l.product))}</small></span><strong>${money(l.total)}</strong></li>`).join('')}</ul>
 <dl class="co-totals"><div><dt>Subtotal</dt><dd>${money(t.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${t.delivery?money(t.delivery):'<span class="co-free">Free</span>'}</dd></div>${t.delivery?`<div class="co-tip"><dt>Add ${money(FREE_DELIVERY_FROM-t.subtotal)} more for free delivery</dt></div>`:''}<div class="co-grand"><dt>Total</dt><dd>${money(t.total)}</dd></div></dl>
 <p class="co-assure">Orders are confirmed by the shop before packing. You'll be notified at every step.</p></aside>`;
}

/**
 * ctx: {view, esc, money, products(), cartItems(), customer(), savedData(), save(), itemVisual, returnLabel,
 *       placeSearch, captureLocation, point, action, message, placeOrder(body), back(), payment(body)}
 */
export function renderCheckout(ctx,draft={}){
 const {esc,money}=ctx,data=ctx.savedData(),profile=data.profile||{},addresses=data.addresses||[];
 const items=ctx.cartItems(),t=orderTotals(items,ctx.products());
 if(!t.lines.length){ctx.back();ctx.message('Your cart is empty.');return;}
 let selectedId=draft.address_id??(addresses.find(a=>a.id===data.defaultAddress)||addresses[0])?.id??'new';
 const payment=draft.payment_method||'COD';
 ctx.view.innerHTML=`<div class="co-page">
 <div class="co-head"><button id="coBack" type="button" class="secondary">← Back to cart</button><ol class="co-steps" aria-label="Checkout progress"><li class="done">Cart</li><li class="current" aria-current="step">Address & payment</li><li>Confirmation</li></ol></div>
 <div class="co-layout"><form id="checkoutForm" novalidate>
 <section class="card co-section"><h2><span class="co-num">1</span>Delivery address</h2>
  ${addresses.length?`<div class="co-addresses" role="radiogroup" aria-label="Saved addresses">${addresses.map(a=>`<label class="co-address"><input type="radio" name="address_id" value="${esc(a.id)}" ${a.id===selectedId?'checked':''}><span><strong>${esc(a.name)}</strong> <em>${esc(a.label||'Home')}</em><br>${esc(formatAddress(a))}<br><small>+91 ${esc(a.phone)}</small></span></label>`).join('')}<label class="co-address co-address-new"><input type="radio" name="address_id" value="new" ${selectedId==='new'?'checked':''}><span><strong>+ Deliver to a new address</strong></span></label></div>`:'<input type="hidden" name="address_id" value="new">'}
  <div id="coNewAddress" ${selectedId==='new'?'':'hidden'}>${addressFields(esc,{name:profile.name,phone:profile.phone,...(draft.newAddress||{})})}
  <label class="co-check"><input type="checkbox" name="save_address" ${draft.save_address===false?'':'checked'}> Save this address for faster checkout</label></div>
  <details class="co-pin-map"><summary>Pin exact location on map <span class="co-optional">(optional, helps the delivery partner)</span></summary><div id="checkoutPlace"></div><input name="destination_lat" id="destinationLat" type="hidden" value="${esc(draft.destination?.lat??'')}"><input name="destination_lng" id="destinationLng" type="hidden" value="${esc(draft.destination?.lng??'')}"><button id="useDeliveryLocation" type="button" class="secondary">Use my current location</button><small id="checkoutGeoStatus" role="status"></small></details>
 </section>
 <section class="card co-section"><h2><span class="co-num">2</span>Payment method</h2>
  <div class="co-payments" role="radiogroup" aria-label="Payment method">${PAYMENT_METHODS.map(m=>`<label class="co-payment"><input type="radio" name="payment" value="${m.id}" ${payment===m.id?'checked':''}><span><strong>${m.title}</strong><small>${m.note}</small></span>${m.online?'<em class="co-badge">Online</em>':''}</label>`).join('')}</div>
  <p class="co-secure" id="coPayNote"></p>
 </section>
 <div class="co-place"><div><small>Total payable</small><strong>${money(t.total)}</strong></div><button id="placeOrder" class="co-cta"></button></div>
 <p class="co-legal muted">By placing the order you agree to the shop's return policy shown for each item.</p>
 </form>${summary(ctx,t)}</div></div>`;
 const form=ctx.view.querySelector('#checkoutForm'),newBox=form.querySelector('#coNewAddress'),cta=form.querySelector('#placeOrder'),note=form.querySelector('#coPayNote');
 wireAddressInputs(form);
 const setPayment=()=>{const m=PAYMENT_METHODS.find(m=>m.id===form.payment.value);cta.textContent=m.online?`Continue to pay ${money(t.total)}`:`Place order · ${money(t.total)}`;note.textContent=m.online?'Online payments are a demo in this shop: no money is collected and you will never be asked for card numbers, OTP or UPI PIN.':'No advance payment needed. Keep the exact amount or a UPI app ready at delivery.';};
 form.querySelectorAll('[name="payment"]').forEach(r=>r.onchange=setPayment);setPayment();
 form.querySelectorAll('[name="address_id"]').forEach(r=>r.onchange=()=>{newBox.hidden=form.address_id.value!=='new';if(!newBox.hidden)newBox.querySelector('input[name="name"]').focus();});
 ctx.placeSearch(form.querySelector('#checkoutPlace'),p=>{form.destination_lat.value=p.lat;form.destination_lng.value=p.lng;});
 form.querySelector('#useDeliveryLocation').onclick=()=>ctx.captureLocation(p=>{form.destination_lat.value=p.lat;form.destination_lng.value=p.lng;},form.querySelector('#checkoutGeoStatus'));
 ctx.view.querySelector('#coBack').onclick=ctx.back;
 form.onsubmit=ctx.action(async e=>{
  const f=Object.fromEntries(new FormData(form)),addressId=form.address_id.value;
  let address;
  if(addressId==='new'){
   const {address:a,errors}=validateAddress(f);
   if(!showErrors(form,errors))throw Error('Please correct the highlighted address fields.');
   address=a;
   const d=ctx.savedData(),key=x=>[x.name,x.phone,formatAddress(x)].join('|').toLowerCase();
   if(form.save_address.checked&&!(d.addresses||[]).some(x=>key(x)===key(a))){d.addresses??=[];const rec={...a,id:'ADDR-'+Date.now()};d.addresses.push(rec);if(!d.defaultAddress)d.defaultAddress=rec.id;ctx.save();}
  }else address=addresses.find(a=>a.id===addressId);
  if(!address)throw Error('Choose a delivery address.');
  const method=PAYMENT_METHODS.find(m=>m.id===f.payment);
  const body={name:address.name,phone:String(address.phone).replace(/^(\+91|0)/,''),address:formatAddress(address),payment_method:method.online?'Online demo':'COD',payment_channel:method.online?method.title:undefined,destination:ctx.point({lat:f.destination_lat,lng:f.destination_lng},true),items:ctx.cartItems()};
  const back={address_id:addressId==='new'?'new':addressId,newAddress:addressId==='new'?address:undefined,payment_method:method.id,destination:body.destination};
  if(method.online){ctx.payment(body,back);return;}
  await ctx.placeOrder(body);
 });
}

/** Simulated online payment step (no gateway is connected). */
export function renderPayment(ctx,body,back){
 const {esc,money}=ctx,t=orderTotals(body.items,ctx.products());
 for(const i of body.items){const p=ctx.products().find(p=>p.id===i.product_id&&p.active);if(!p||p.stock<i.quantity)throw Error('Please refresh your cart: stock has changed.');}
 ctx.view.innerHTML=`<div class="co-page"><div class="co-head"><button id="coBackPay" type="button" class="secondary">← Change payment method</button><ol class="co-steps"><li class="done">Cart</li><li class="done">Address</li><li class="current" aria-current="step">Payment</li></ol></div>
 <div class="co-layout"><section class="card co-section co-paybox"><span class="co-demo">Demo payment · no real transaction</span><h2>Pay ${money(t.total)}</h2><p class="muted">Paying with <strong>${esc(body.payment_channel)}</strong> · delivering to ${esc(body.name)}, ${esc(body.address)}</p>
 <p class="co-secure">This shop is not connected to a payment gateway yet. Use the buttons below to preview what happens after a successful or failed payment. Never enter card numbers, OTP or UPI PIN here.</p>
 <div class="row"><button id="demoPay" class="co-cta">Simulate successful payment</button><button id="demoFail" class="secondary">Simulate failed payment</button></div></section>${summary(ctx,t)}</div></div>`;
 ctx.view.querySelector('#coBackPay').onclick=()=>{renderCheckout(ctx,back);};
 ctx.view.querySelector('#demoPay').onclick=ctx.action(async()=>{body.payment_reference='DEMO-PAY-'+Date.now().toString(36).toUpperCase();await ctx.placeOrder(body);ctx.message('Payment simulated successfully. Your order is awaiting shop confirmation. No money was charged.');});
 ctx.view.querySelector('#demoFail').onclick=()=>{renderCheckout(ctx,back);ctx.message('Payment failed (simulated). No order was created and your cart is unchanged.');};
}
