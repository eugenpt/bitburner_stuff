/** @param {NS} ns **/
export async function main(ns) {
	var servers = ns.getPurchasedServers(); 
	for(var server of servers){
		ns.tprint('Stopping '+server+' ..');
		ns.killall(server);
		ns.rm('hack.ns', server);
		await ns.scp('hack.ns','home',server);
		var target = server.slice(server.indexOf('->')+2);
		ns.exec(
			'hack.ns', 
			server, 
			Math.floor(ns.getServerMaxRam(server)/ns.getScriptRam('hack.ns')),
			target
		);
		ns.tprint('. ok.');
	};
}