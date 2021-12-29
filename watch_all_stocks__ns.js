/** @param {NS} ns **/
export async function main(ns) {
  NS = ns;
  var watched = getWatchedStocks(ns);
    ns.stock.getSymbols().filter((sym) => watched.indexOf(sym)==-1)
                         .forEach((sym)=>{
        ns.exec('stock_watch.ns','home',1,sym);
    }) 
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
  var pos = NS.stock.getPosition(R.sym);
  R.player = {
    shares: pos[0],
    price: pos[1],
    total_price: pos[0]*pos[1],
  }
}


function getWatchedStocks(ns){
    return ns.ps('home').filter(proc=>proc.filename=='stock_watch.ns')
                        .map(proc => proc.args)
                        .flat()
}