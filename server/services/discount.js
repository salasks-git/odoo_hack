const db = require('../db');
function validateDiscount({code, subtotal, quantity, productIds, date}) {
  const now = date ? new Date(date).toISOString() : new Date().toISOString();
  const disc = db.prepare('SELECT * FROM discounts WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(code);
  if (!disc) return {valid:false,reason:'Invalid code'};
  if (disc.start_date && disc.start_date > now) return {valid:false,reason:'Not started'};
  if (disc.end_date && disc.end_date < now) return {valid:false,reason:'Expired'};
  if (disc.usage_limit !== null && disc.times_used >= disc.usage_limit) return {valid:false,reason:'Usage limit reached'};
  if (subtotal < disc.min_amount) return {valid:false,reason:'Minimum amount not met'};
  if (quantity < disc.min_quantity) return {valid:false,reason:'Minimum quantity not met'};
  if (disc.product_id && !productIds.includes(disc.product_id)) return {valid:false,reason:'Product not eligible'};
  let amount = 0;
  if (disc.type === 'percentage') {
    if (disc.value > 100) return {valid:false,reason:'Invalid percentage'};
    amount = Math.floor(subtotal * disc.value / 100);
  } else {
    amount = Math.min(disc.value, subtotal);
  }
  return {valid:true,reason:null,amount};
}
module.exports = {validateDiscount};

