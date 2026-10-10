import test from 'node:test';
import assert from 'node:assert/strict';
import {emi,bonusModel,homeModel,emergencyModel,cardModel} from '../dist/finance.js';
test('loan payment handles zero rate and amortizes principal',()=>{assert.equal(emi(120000,0,12),10000);const payment=emi(780000,8.7,60);let debt=780000;for(let i=0;i<60;i++)debt=debt*(1+8.7/1200)-payment;assert.ok(Math.abs(debt)<.0001);});
test('bonus uses equal budgets; rate can change the financial ranking',()=>{const zero=bonusModel({rate:0,years:5}),high=bonusModel({rate:15,years:5});assert.ok(zero.find(x=>x.id==='repay').net>zero.find(x=>x.id==='invest').net);assert.ok(high.find(x=>x.id==='invest').net>high.find(x=>x.id==='repay').net);for(const row of zero)assert.ok(row.debt<.01);const cash=zero.find(x=>x.id==='cash');assert.ok(Math.abs(cash.portfolio-300000)<.001);});
test('home deducts transaction costs and remaining debt',()=>{const a=homeModel({years:3,growth:0}),b=homeModel({years:3,growth:10});assert.ok(Math.abs(a.buyCosts-966000)<.001);assert.ok(Math.abs(a.down-3034000)<.001);assert.ok(Math.abs(a.loan-10766000)<.001);assert.ok(Math.abs(a.owner-(13800000*.98-a.debt))<.001);assert.ok(b.owner>a.owner);assert.equal(a.renter,b.renter);assert.ok(a.firstMonthly>a.payment);});
test('emergency separates cash shortfall and remaining FD',()=>{const rows=emergencyModel({essential:40000,delay:4});assert.equal(rows[0].afterDelay,-60000);assert.equal(rows[1].afterDelay,39000);assert.equal(rows[1].fd,200000);assert.ok(rows[2].cost>0);assert.ok(rows[2].emi>8333);});
test('real card estimates respect Prime, standard fees, renewal and no-fee preference',()=>{
 const prime=cardModel({profile:'everyday',prime:true}),nonprime=cardModel({profile:'everyday',prime:false});
 assert.equal(prime.find(x=>x.id==='icici').rewards-nonprime.find(x=>x.id==='icici').rewards,6000*.02*12);
 assert.equal(prime.find(x=>x.id==='sbi').rewards,12*(15000*.05+12000*.01));
 assert.equal(prime.find(x=>x.id==='hdfc').rewards,12*(10000*.05+17000*.01));
 assert.equal(prime.find(x=>x.id==='icici').annualFee,0);
 const renewal=cardModel({profile:'everyday',year:'renewal'});assert.ok(renewal.every(x=>x.annualFee===0));
 const light=cardModel({profile:'light',year:'renewal'});assert.ok(light.find(x=>x.id==='sbi').annualFee>0);
 assert.equal(cardModel({fee:'none'}).find(x=>x.eligible).id,'icici');
});
