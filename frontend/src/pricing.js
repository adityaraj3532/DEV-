// Original price (MRP), selling price and offer discount. Shared by the server and the app.
// price_paise = what the customer pays; mrp_paise = original price shown struck through (optional).

/** Whole-number % off, or 0 when there is no discount. */
export function discountPercent(p){
 const mrp=Number(p?.mrp_paise),price=Number(p?.price_paise);
 return Number.isFinite(mrp)&&price>0&&mrp>price?Math.round((mrp-price)/mrp*100):0;
}

/** Validates prices from the owner. Returns {price_paise, mrp_paise} (mrp_paise null = no offer). */
export function validatePricing(price_paise,mrp_paise){
 const price=Number(price_paise);
 if(!Number.isInteger(price)||price<1||price>100000000)throw Error('Enter a selling price from ₹0.01 to ₹10,00,000.');
 if(mrp_paise==null||mrp_paise===''||Number(mrp_paise)===0)return {price_paise:price,mrp_paise:null};
 const mrp=Number(mrp_paise);
 if(!Number.isInteger(mrp)||mrp>100000000)throw Error('Enter a valid original price.');
 if(mrp<price)throw Error('The original price must be the same as or higher than the selling price.');
 return {price_paise:price,mrp_paise:mrp===price?null:mrp};
}

/** Selling price from an original price and a discount %, rounded to the nearest rupee. */
export function priceFromDiscount(mrp_paise,percent){
 const pct=Number(percent);
 if(!(Number(mrp_paise)>0)||!Number.isFinite(pct)||pct<0||pct>=100)return null;
 return Math.max(100,Math.round(mrp_paise*(100-pct)/100/100)*100);
}

/** Price markup: "₹current ₹original(struck) 20% off", or just the price when there is no offer. */
export function priceTag(p,money){
 const off=discountPercent(p);
 return off?`<span class="price-now">${money(p.price_paise)}</span> <s class="price-was" aria-label="Original price ${money(p.mrp_paise)}">${money(p.mrp_paise)}</s> <span class="price-off">${off}% off</span>`:money(p.price_paise);
}
