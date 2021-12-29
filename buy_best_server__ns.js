/** @param {NS} ns **/
export async function main(ns) {
	var args = ns.args.map(s=>s);

	var ALL_ANSWERS_YES = false;
	if(args.length>0){
		if(
			args.filter(s => (s+'').toLocaleLowerCase()=='-y')
			    .length > 0
		){
			ALL_ANSWERS_YES = true;
			args = args.filter(s => !( (s+'').toLocaleLowerCase()=='-y'));
		}
	}
	var target_hostname = null;
	if (args.length > 0){
		target_hostname = args[0];
		var temp = ns.getServer(target_hostname);
	}

    var max_ram = ns.getPurchasedServerMaxRam();
	var max_servers = ns.getPurchasedServerLimit();
	var player_servers = ns.getPurchasedServers().length;

	if (max_servers == player_servers){
		ns.tprint('Already have '+player_servers+'/'+max_servers+' servers');
		return;
	}

    var player_money = ns.getPlayer().money;
    var ram2buy = max_ram;
	while(player_money < ns.getPurchasedServerCost(ram2buy)){
		ram2buy /= 2;
	}

	while(ram2buy>=1){

	if ((ALL_ANSWERS_YES)
		||(await ns.prompt('Really buy '+ram2str(ram2buy)+' server '
				 +'for '+ns.nFormat(ns.getPurchasedServerCost(ram2buy),'0.000a')))
	){
		var base_hostname = ram2str(ram2buy)+(target_hostname ? ('->'+target_hostname):'');
		
		var host = await ns.purchaseServer(base_hostname, ram2buy);
		ns.tprint('Bought new ['+host+'] server with '+ram2buy+'GB of RAM');	
		await ns.scp('hack.ns','home',host);
		var target = target_hostname ? target_hostname : 'silver-helix';

		if((ALL_ANSWERS_YES)
		  ||(await ns.prompt('Wanna launch a full blown hack on '+target+'?'))){
			await ns.exec(
				'hack.ns', 
				host, 
				Math.floor(ram2buy/ns.getScriptRam('hack.ns')),
				target
			);
			ns.tprint('Launched hack attack on '+target);
		} else {
			ns.tprint('No for launching attack on '+target);
		}
		break;
	} else {
		ns.tprint('No for buying servers, ok');
	}
	ram2buy /= 2;
	}
}

function ram2str(ram){
	return ram>=1024 ? (Math.floor(ram/1024)+'TB') : (ram+'GB');
}