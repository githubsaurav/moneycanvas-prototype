// Pure, deterministic demo models. All rates and profiles are illustrative.
export function emi(principal, annualRate, months) {
  if (months <= 0) throw new RangeError('Loan term must be positive');
  const r=annualRate/1200;
  return r===0 ? principal/months : principal*r/(1-(1+r)**(-months));
}
export function bonusModel({rate=10, years=5}={}) {
  const principal=780000, apr=8.7, bonus=300000, payment=emi(principal,apr,60), months=years*12;
  return [
    {id:'repay',name:'Repay the loan',prepay:bonus,invest:0,cash:0},
    {id:'split',name:'Split it 50 / 50',prepay:bonus/2,invest:bonus/2,cash:0},
    {id:'invest',name:'Invest the bonus',prepay:0,invest:bonus,cash:0},
    {id:'cash',name:'Keep as cash',prepay:0,invest:0,cash:bonus}
  ].map(option=>{
    let debt=principal-option.prepay,portfolio=option.invest,interest=0,debtFree=null;
    for(let m=1;m<=months;m++){
      portfolio*=1+rate/1200;
      const charge=debt*apr/1200;interest+=charge;
      const paid=Math.min(payment,debt+charge);
      debt=Math.max(0,debt+charge-paid);
      portfolio+=payment-paid; // Same monthly budget; invest any freed EMI.
      if(debt<.01&&debtFree===null)debtFree=m;
    }
    return {...option,portfolio:portfolio+option.cash,debt,net:portfolio+option.cash-debt,interest,debtFree,payment};
  });
}
export function homeModel({years=7,growth=5,rent=48000}={}) {
  const price=13800000,upfront=4000000,buyCosts=price*.07,down=upfront-buyCosts;
  const loan=price-down,payment=emi(loan,8.5,240),investmentRate=8/1200;
  let debt=loan,renter=upfront,ownerSavings=0;
  for(let m=0;m<years*12;m++){
    const year=Math.floor(m/12),monthlyRent=rent*1.05**year;
    const maintenance=price*.01/12*1.05**year;
    const paid=Math.min(payment,debt*(1+8.5/1200));
    debt=Math.max(0,debt*(1+8.5/1200)-paid);
    const difference=paid+maintenance-monthlyRent;
    renter=renter*(1+investmentRate)+Math.max(0,difference);
    ownerSavings=ownerSavings*(1+investmentRate)+Math.max(0,-difference);
  }
  const futureHome=price*(1+growth/100)**years,owner=futureHome*.98-debt+ownerSavings;
  return {owner,renter,difference:owner-renter,payment,loan,down,buyCosts,debt,futureHome,firstMonthly:payment+price*.01/12};
}
export function emergencyModel({delay=2,essential=40000,priority='buffer'}={}) {
  const savings=200000,fd=300000,expense=100000,emiPayment=emi(expense,15,12);
  return [
    {id:'savings',name:'Use savings',cash:savings-expense,fd,emi:0,cost:0,note:'No new debt. Your bank balance takes the hit.'},
    {id:'fd',name:'Use a fixed deposit',cash:savings,fd:fd-expense,emi:0,cost:1000,note:'Keeps bank cash available. Assumes ₹1,000 lost interest / penalty.'},
    {id:'emi',name:'Pay over 12 months',cash:savings,fd,emi:emiPayment,cost:emiPayment*12-expense,note:'Preserves today’s cash, adds a monthly commitment.'}
  ].map(o=>({...o,afterDelay:o.cash-delay*(essential+o.emi)-(o.id==='fd'?o.cost:0),runway:(o.cash-(o.id==='fd'?o.cost:0))/(essential+o.emi),totalBuffer:o.cash+o.fd-(o.id==='fd'?o.cost:0),priority}));
}
// Monthly example budgets. Categories are mutually exclusive.
export const cardProfiles = {
  everyday: {name:'Everyday mix', amazon:6000, partners:4000, online:5000, offline:12000, excluded:3000},
  online: {name:'Mostly online', amazon:10000, partners:6000, online:8000, offline:4000, excluded:2000},
  light: {name:'Light spender', amazon:2000, partners:1000, online:2000, offline:8000, excluded:2000}
};
export function cardModel({profile='everyday',prime=true,fee='any',year='first'}={}) {
  const spend=cardProfiles[profile];
  if(!spend) throw new Error('Unknown spending profile');
  const total=spend.amazon+spend.partners+spend.online+spend.offline+spend.excluded;
  const eligibleSpend=total-spend.excluded;
  return [
    {id:'hdfc',bank:'HDFC Bank',name:'Millennia',fee:1000,waiver:eligibleSpend*12>100000,
      rewards:12*(Math.min(1000,(spend.amazon+spend.partners)*.05)+Math.min(1000,(spend.online+spend.offline)*.01)),
      headline:'5% at selected brands',benefit:'Amazon, Flipkart, Swiggy and other listed brands; 1% on other eligible spending.',
      redemption:'CashPoints redeemed against the card balance; redemption charges may apply.',
      source:'https://www.hdfc.bank.in/credit-cards/millennia-credit-card'},
    {id:'sbi',bank:'SBI Card',name:'CASHBACK',fee:999,waiver:eligibleSpend*12>=200000,
      rewards:12*(Math.min(2000,(spend.amazon+spend.partners+spend.online)*.05)+Math.min(2000,spend.offline*.01)),
      headline:'5% on eligible online spend',benefit:'1% on eligible offline spending. Each bucket is capped at ₹2,000 per statement cycle.',
      redemption:'Cashback credited to the card account automatically.',
      source:'https://www.sbicard.com/en/personal/credit-cards/cashback-sbi-card.html'},
    {id:'icici',bank:'ICICI Bank',name:'Amazon Pay',fee:0,waiver:false,
      rewards:12*(spend.amazon*(prime?.05:.03)+(spend.partners+spend.online+spend.offline)*.01),
      headline:prime?'5% on eligible Amazon shopping':'3% on eligible Amazon shopping',
      benefit:'No joining or annual fee. Other eligible spending earns 1% in this model.',
      redemption:'Rewards credited as Amazon Pay balance, not cash to your bank.',
      source:'https://www.icici.bank.in/personal-banking/cards/credit-card/amazon-pay-credit-card'}
  ].map(c=>{const annualFee=(year==='renewal'&&c.waiver?0:c.fee)*1.18;return {...c,annualFee,net:c.rewards-annualFee,eligible:fee!=='none'||c.fee===0,spend,total};}).sort((a,b)=>b.net-a.net);
}
export const rupee=value=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Math.round(value));
export function compact(value){const sign=value<0?'−':'';const v=Math.abs(value);return sign+'₹'+(v>=10000000?(v/10000000).toFixed(2)+' cr':v>=100000?(v/100000).toFixed(2)+'L':v>=1000?(v/1000).toFixed(1)+'k':Math.round(v));}
