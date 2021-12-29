/** @param {NS} ns **/
export async function main(ns) {
  var target = ns.args[0];//ns.args.length>0 ? ns.args[0] : ns.getHostname() ;
  var moneyThresh = ns.getServerMaxMoney(target) * 0.75;
  var securityThresh = ns.getServerMinSecurityLevel(target) + 40;// 5;
  while(true) {
          var money = await ns.hack(target);
          // if(money > ns.getPlayer().money * 0.01){
          //     ns.tprint('Hacked '+target+' for '+ns.nFormat(money, '0.000a'));
          // }
      if (ns.getServerSecurityLevel(target) > securityThresh) {
          await ns.weaken(target);
      }
     if (ns.getServerMoneyAvailable(target) < moneyThresh) {
          await ns.grow(target);
     }
  }
}