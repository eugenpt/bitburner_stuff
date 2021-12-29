/** @param {NS} ns **/
export async function main(ns) {
  NS = ns;
//    var sym = 'JGN';//'BLD';
//  ns.tprint(sym+' : '+ns.stock.getForecast(sym)+' '+ns.stock.getPosition(sym));

  var symbols = ns.stock.getSymbols();

  var watched_syms = getWatchedStocks(ns);

  var Stocks = symbols.map(getStock);

  Stocks.sort(sortPropFun('total_price','desc'));
  Stocks.sort(sortPropFun('rel_forecast'));

  Stocks.forEach((S) => {
      ns.tprint(ns.sprintf(
          '%5s %1s : %9s %6s %.3f %4iv %5s %s',
          S.sym, 
          watched_syms.indexOf(S.sym)>=0 ? '*' : '',
          ns.nFormat(S.total_price,'0.000a'),
          S.player.shares ? ns.sprintf('%i%%',S.player.shares * 100/S.max_shares) : ' ',
          S.forecast,
          S.volatility*1000,
          stock_forecast_str(S),
          stock_rel_forecast_str(S)
      ));
  });

  var total_stock_money = sum(Stocks.map((S) => ns.stock.getBidPrice(S.sym) * S.player.shares));

  ns.tprintf('\nTotal money in stocks: %s', ns.nFormat(total_stock_money,'0.00a'));
}

function sum(arr){
return arr.reduce((a,b) => a + b);
}

var NS = {};

function getStock(sym){
var R = {
  sym: sym,
  max_shares: NS.stock.getMaxShares(sym),
  volatility: NS.stock.getVolatility(sym),
};
updateStock(R);
return R;
}

function updateStock(R){
R.price = NS.stock.getPrice(R.sym);
R.forecast = NS.stock.getForecast(R.sym);
R.total_price = R.price * R.max_shares;

R.rel_forecast = (R.forecast - 0.5)/R.volatility;
var pos = NS.stock.getPosition(R.sym);
R.player = {
  shares: pos[0],
  price: pos[1],
  total_price: pos[0]*pos[1],
}
}

function stock_rel_forecast_str(S){
var n = Math.log(Math.abs(S.rel_forecast));
var s = S.rel_forecast > 0 ? '+' : '-';
var r = '';
for(var j=0;j<n ; j++){
  r+=s;
}
return r;
}

function stock_forecast_str(S){
S = S.forecast || S;
var r = '';
if(S>0.5){
  for(var j=0.55 ; j<=S ; j+=0.05){
    r+='+';
  }
} else {
  for(var j=0.45 ; j>=S ; j-=0.05){
    r+='-';
  }
}
return r;
}

function sortPropFun(prop, desc){
  var order = desc ? -1 : 1;
  return function(a,b){
      return order*(a[prop] - b[prop])
  }
}


function getWatchedStocks(ns){
  return ns.ps('home').filter(proc=>proc.filename=='stock_watch.ns')
                      .map(proc => proc.args)
                      .flat()
}