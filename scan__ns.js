/** @param {NS} ns **/
export async function main(ns) {
	var args = ns.args.map(x=>x);
	
	ALL_ANSWERS_YES = false;
	if(any(args, s=>(''+s).toLowerCase()=='-y')){
		args = args.filter(s=>(''+s).toLowerCase()!='-y');
		ALL_ANSWERS_YES = true;
		ns.tprint('ALL_ANSWERS_YES');
	}
	RESTART_ALL_HACKS = false;
	if(any(args, s=>(''+s).toLowerCase()=='-r')){
		args = args.filter(s=>(''+s).toLowerCase()!='-r');
		RESTART_ALL_HACKS = true;
		ns.tprint('RESTART_ALL_HACKS');
	}
	
	var show_files = any(args, s=>(''+s).toLowerCase()=='-f');

	deepscan_max_level = args.length > 0 ? args[0]*1 : 10;


	ns.disableLog('scan');
	ep_HOSTS = {};
	ep_ROOT_hosts_money = {};

	ep_hosts_nobackdoor = [];
	ep_new_hosts = [];	
	//return
	var Ss = await deepscan(ns,'home');

	for(var k in ep_HOSTS){
		if(ep_HOSTS[k].money){
			ns.print(k + ' : '+ep_HOSTS[k].money +' '+ep_HOSTS[k].salary);
		}
	}
	//return
	ns.tprint('With admin rights money:');
	Ss.filter(s=>s)
	  .filter(s=>s.hasAdminRights)
	  .filter(s=>s.moneyMax > 0)
	  .sort(sortPropFun('moneyMax','desc'))
//	  .sort((a,b) => a.moneyAvailable > b.moneyAvailable ? -1 : 1)
	  .forEach(s=>{
		  if(!s){ return }
		ns.tprint(
			ns.sprintf(
				'%18s : %s$/%s$  %s',
				s.hostname, 
				$2s(ns,s.moneyAvailable),
				$2s(ns,s.moneyMax),
				have_hack_on(ns, s.hostname) || '' 
			)
		);
	});

	var servers_with_contracts = Ss.filter((s) => server_has_contracts(ns,s));
	if (servers_with_contracts.length > 0 ) {
		ns.tprint('Available contracts files in:')
		for(var server of servers_with_contracts){
			ns.tprint(server.ep_path.join(' - '));
			var contract_files = server_contracts(ns, server);
			var host = server.hostname;
			for(var filename of contract_files){
				var type =ns.codingcontract.getContractType(filename, host);
				var data =ns.codingcontract.getData(filename, host);
				var desc = ns.codingcontract.getDescription(filename, host);
				ns.tprint(ns.sprintf(
					'type : %s\n data : %s\n',
					type,
					Array.isArray(data) ? JSON.stringify(data):data
				));
				if(CONTRACT_SOLUTIONS[type]){
					var answer = CONTRACT_SOLUTIONS[type](data);
					if ((ALL_ANSWERS_YES)||( await ns.prompt(type + '<br>'+data+'<br>'+desc+'\n\n'+'Proposed answer:\n\n'+answer))){
					//if(1){
						var res = ns.codingcontract.attempt(answer,filename,host);
						if(res){
							await ns.alert('Yes!');
							ns.tprint('Hey! solved it!');
						} else {
							await ns.alert('No =(');
							ns.tprint('=(. answer=|'+answer+'| was not OK. =(');
						}
					}
				}else {
					ns.tprint('<Unknown solution>');
					ns.tprint(desc);
				}
			};
		};
	}

	if (ep_hosts_nobackdoor.length > 0 ) {
		ns.tprint('++ No backdoors:');
		ep_hosts_nobackdoor.forEach(a=>ns.tprint('++ '+a));
	} else {
		ns.tprint('-- No new servers without backdoors.');
	}
	if (ep_new_hosts.length > 0 ) {
		ns.tprint('New hosts:');
		ep_new_hosts.forEach(a=>ns.tprint(a));
	} else {
		ns.tprint('-- No new hosts');
	}

	if(show_files){
		ns.tprint('Files:')
		var files_paths = {}
		Ss.forEach(server => {
			if(server.hostname=='home'){ 
				return;
			}

			var files = ns.ls(server.hostname);
			for(var file of files){
				if(!files_paths.hasOwnProperty(file)){
					files_paths[file] = server.ep_path.join(' - ');
					// ns.scp(file, server.hostname, 'home');
					ns.tprint(file+' @ '+server.hostname);
				}
			}
		});
	}




	var next_min_hack = min(Ss.filter(S=>S.numOpenPortsRequired <= canHackNPorts(ns))
							  .filter(S => !S.hasAdminRights)
							  .map(S => S.requiredHackingSkill));
	ns.tprint('Next hack on skill '+next_min_hack);
}

function min(arr){
	var r = Infinity;
	for(var j of arr){
		if (j<r) {
			r = j;
		}
	}
	return r;
}

function any(arr, cond_fun){
	for(var j of arr){
		if(cond_fun(arr)){
			return true;
		}
	}
	return false;
}

var deepscan_max_level = 10;

var ALL_ANSWERS_YES = false;
var RESTART_ALL_HACKS = false;


var ep_HOSTS = {};
var ep_ROOT_hosts_money = {};

var ep_hosts_nobackdoor = [];
var ep_new_hosts = [];

function $2s(ns, v){
	return ns.nFormat(v, '0.000a');
}

function have_hack_on(ns, host){
	var r_hosts_gb = [];
	var servers = ns.getPurchasedServers();
	for(var server of servers){
		var target = server.slice(server.indexOf('->')+2);
		if (target==host) {
			r_hosts_gb.push(server.slice(0, server.indexOf('->')));
		}
	}
	return r_hosts_gb.length>0 
		   ? '['+r_hosts_gb.join(',')+']' 
		   : false;
}

function server_has_contracts(ns, server){
	return (server_contracts(ns, server).length > 0);
}

function server_contracts(ns, server){
	var files = ns.ls(server.hostname);
	return files.filter(s=>s.indexOf(".cct")>=0);
}


async function deepscan(ns, host, path){
	var R = [];
	if (path === undefined){
		path = [];
	}
	var level = path.length;

	if(ep_HOSTS.hasOwnProperty(host)){
		ns.print(prefix(level)+host+' already scanned');
		return R;
	}
	ep_HOSTS[host] = 0;
	
	var server = ns.getServer(host);

	R.push(server);
	server.ep_path = path.map(v => v);


	var print_s = host+' '+server.ip+' ';

	openPorts(ns, server);
	if (can_hack(ns, host)){
		if (!server.hasAdminRights){
			ns.nuke(host);
		}
		if(ns.fileExists('hack.ns', host)){
			ns.rm('hack.ns', host);
		} else {
			ep_new_hosts.push(path.join(' - '));
		}
		if(!ns.fileExists('hack.ns', host)){
			await ns.scp('hack.ns','home',host);
		}

		if((RESTART_ALL_HACKS)&&(ns.isRunning('hack.ns',host,host))){
			var r = ns.kill('hack.ns', host, host);
			ns.tprint(path.join(' - ')+' : killing hack..'+(r?' +' : ' -- =(('));
		}

		

		if(!ns.isRunning('hack.ns',host)){	
			var ram = ns.getServerRam(host);
			var run_nthreads = (ram[0] - ram[1])/ns.getScriptRam('hack.ns','home')
			if(run_nthreads > 1){
				// ep_new_hosts.push(path.join(' - '));
				ns.exec(
					'hack.ns',
					host,
					Math.floor(run_nthreads),
					host
				);
			}
			
		}
		
		if (!server.backdoorInstalled){
			ep_hosts_nobackdoor.push(path.join(' - '));
		}
		
		var money = ns.getServerMoneyAvailable(host);
		var money_perc = ns.hackAnalyze(host);
		var chance = ns.hackAnalyzeChance(host);
		var time = ns.getHackTime(host);

		var salary = money * money_perc * chance / time;
		ep_HOSTS[host] = {money:money, salary:salary};
		print_s += sprintf('avail:%i %.2f$/s', money, salary);
		//print_s += ns.sprintf('%.2f',money_perc*100)+'% ';

		if(server.hasAdminRights){
			ep_ROOT_hosts_money[host] = money;
		}
	}

	
	var hosts = ns.scan(host);
	print_s += hosts.length;
	ns.print(
		prefix(level) + print_s
	);
	ns.print(ns.hackAnalyzeChance(host));
	if(level > deepscan_max_level){
		return R;
	}
	for(var jhost of hosts){
		var npath = path.map(v=>v);
		npath.push(jhost);
		
		var rs = await deepscan(ns, jhost, npath);
		rs.forEach((s) => R.push(s));
	}
	return R;
}

function can_hack(ns, host){
	return (
		( host != 'home' )
	 && (!ns.getServer(host).purchasedByPlayer)	
	 && (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host))
	 && (ns.getServer(host).openPortCount >= ns.getServerNumPortsRequired(host))
	);
}

function prefix(level){
	var prefix_ = '';
	for(var j=0;j<level;j++){
		prefix_ = prefix_ + '-';
	}
	return prefix_;
}

function openPorts(ns, server){
	var host = server.hostname;
	
	if ((ns.fileExists('BruteSSH.exe'))&&(!server.sshPortOpen)) {
		ns.brutessh(host);
	}
	if ((ns.fileExists('FTPCrack.exe'))&&(!server.ftpPortOpen)) {
		ns.ftpcrack(host);
	}
	if ((ns.fileExists('relaySMTP.exe'))&&(!server.smtpPortOpen)) {
		ns.relaysmtp(host);
	}
	if ((ns.fileExists('SQLInject.exe'))&&(!server.sqlPortOpen)) {
		ns.sqlinject(host);
	}
	if ((ns.fileExists('HTTPWorm.exe'))&&(!server.httpPortOpen)) {
		ns.httpworm(host);
	}
}

function canHackNPorts(ns){
	ns = ns || NS;
	var r = 0;
	if ((ns.fileExists('BruteSSH.exe'))) {
		r++;
	}
	if ((ns.fileExists('FTPCrack.exe'))) {
		r++;
	}
	if ((ns.fileExists('relaySMTP.exe'))) {
		r++;
	}
	if ((ns.fileExists('SQLInject.exe'))) {
		r++;
	}
	if ((ns.fileExists('HTTPWorm.exe'))) {
		r++;
	}
	return r;
}



var CONTRACT_SOLUTIONS = {
	"Generate IP Addresses": function(data){
		return '['+all_valid_ips(data).join(',')+']';
	},
	"Algorithmic Stock Trader II": function(data){
		return sum_income_anyN(data);
	},
	"Spiralize Matrix": function(data){
		return spiral(data);
	},
	"Sanitize Parentheses in Expression": function(data){
		return all_valid_fixes(data);
	},
	"Minimum Path Sum in a Triangle": function(data){
		return pyramid_min_sum_path(data);
	},
	"Subarray with Maximum Sum": function(data){
		return subarray_with_max_sum(data);
	},
	"Find All Valid Math Expressions": function(data){
		return all_valid_expr(data);
	},
	"Merge Overlapping Intervals": function(data){
		return JSON.stringify(merge_intervals(data));
	},
	"Unique Paths in a Grid I": function(data){
		return npaths(range(data[0]).map(j=>range(data[1]).map(j=>0)));
	},
	"Unique Paths in a Grid II": function(data){
		return npaths(data);
	},
	"Array Jumping Game": function(data){
		return array_jump(data) ? 1 : 0;
	},
	"Algorithmic Stock Trader I": function(data){
		return sum_income(data, 1);
	},
	"Algorithmic Stock Trader III": function(data){
		return sum_income(data, 2);
	},
	// "Algorithmic Stock Trader IV": function(data){
	// 	return sum_income(data);
	// },
	"Total Ways to Sum": function(data){
		return n_ways_to_sum(data);
	},
	"Find Largest Prime Factor": function(data){
		return largestPrimeFactor(data);
	}
}


function largestPrimeFactor(n){
  var i=2;
  while (i<=n){
      if (n%i == 0){
          n/=i;    
      }else{
          i++;
      }
  }
  return i;
}

function n_ways_to_sum(N,max_part){
  // console.log('n_ways_to_sum : N='+N+' max_part='+max_part);
  if(max_part===undefined){
    max_part = N-1;
  }
  var R = 1; 
  if(max_part == 1){
    R = 1;
  } else if(N==2){
    return 1;
  } else if (N==3){
    return max_part==1 ? 1 : 2;
  } else {
    R = max_part >= (N-1) ? 1 : 0;
    for(var max_= Math.min(N-2, max_part) ; max_ > 0 ; max_ -- ){
      var temp = 1 * ((N-max_) <= max_) + n_ways_to_sum(N-max_, max_);
      //console.log('..so '+N+' = '+max_+' + .. -> '+temp+' ways'+(((N-max_) <= max_) ? ' , including '+max_+' + '+(N-max_) : ''));
      R += temp;
    }
  }
//  console.log('n_ways_to_sum : N='+N+' max_part='+max_part+' => '+R+'ways');

  return R;
}

//

function array_jump(data,j){
  if(j===undefined){
    j=0;
  }
  if(j+data[j]>=data.length-1){
    return true;
  }
  for(var i=j+1; i<=j+data[j] ; i++){
    if(array_jump(data,i)){
      return true;
    }
  }
  return false;
}




function merge_intervals(ints){
  var old_ints = ints;
  old_ints.sort((a,b) => a[0]-b[0]);
  while(1){
    var new_ints = [];
    for(var j=0;j<old_ints.length;j++){
      var found = false;
      for(var i=j+1;i<old_ints.length;i++){
        if(intervals_intercept(old_ints[j],old_ints[i])){
          found = true;
          new_ints.push(merge_intervals1(old_ints[j],old_ints[i]));
          for(var k=j+1; k<old_ints.length ;k++){
            if(k!=i){
              new_ints.push(old_ints[k]);
            }
          }
          break;
        }
      }
      if(found){
        break;
      } else {
        new_ints.push(old_ints[j]);
      }
    }
    if(old_ints.length == new_ints.length){
      return new_ints;
    }
    old_ints = new_ints;
  }
}

function intervals_intercept(int1,int2){
  return (int1[0]<=int2[1])&&(int1[1]>=int2[0]);
}

function merge_intervals1(int1,int2){
  return [Math.min(int1[0], int2[0]),Math.max(int1[1],int2[1])];
}


function npaths (x, w, h) {
  let X = [];
  if((w===undefined)&&(h==undefined)&&(Array.isArray(x[0]))){
    X = x;
    w = X[0].length;
    h = X.length;
  } else {
    if (x.length != w * h) {
      console.warn('?? sizes dont match');
      return;
    }

    for (var j = 0; j < h; j++) {
      X.push(x.slice(w * j, w * (j + 1)));
    }
  }
  X = X.map(a=>a.map( v => v == 1 ? null : 0 ));
  
  //console.log(X);

  X[0][0] = 1;

  for (var j = 1; j < h + w - 1; j++) {
    for (let i = 0; i < j + 1; i++) {
      let yc = j - i;
      let xc = i;
      if ((yc >= h) || (xc >= w)) {
        continue;
      }
      if (X[yc][xc] === null) {
        continue;
      }
      if (i == 0) {
        X[j][0] = X[j - 1][0] + 0;
      } else if (i == j) {
        X[0][j] = X[0][j - 1];
      } else {
        X[yc][xc] = 0 + X[yc][xc - 1] + X[yc - 1][xc];
      }
    }
    //console.log(X);
  }
  return X[h - 1][w - 1];
}

function sum(arr){
	return arr.reduce((a,b)=>a+b);
}

function max(arr){
  var R = arr[0];
  for(var j=1; j<arr.length ; j++){
    if(arr[j]>R){
      R = arr[j];
    }
  }
  return R;
//  return Math.max(...arr);
}

function subarray_with_max_sum(arr){
  var ixss = all_subixs(arr.length+1,2);
  var sums = ixss.map(ixs => sum(arr.slice(ixs[0],ixs[1])));
  return max(sums);
}

function pyramid_min_sum_path(x){ 
  for (var y=x.length-2;y>=0;y--){
    for(var j=0;j<x[y].length;j++){
      x[y][j] += Math.min(x[y+1][j],x[y+1][j+1]);
    }
  }
  return x[0][0];
}

function tilt(m){
	return [...Array(m[0].length).keys()].map(j=>m.map(a=>a[a.length-j-1]))
}

function spiral_(m){
	return (m.length==1)? m : m[0].concat(spiral_(tilt(m.slice(1))))
}

function spiral(x){
  return '['+spiral_(x).join(', ')+']';
}


function all_valid_ips(s){
  var ixss = all_subixs(s.length-1,3);
  var ips = ixss.map(ixs => {
    var r = s.substr(0,ixs[0]+1);
    for(var j=1; j<ixs.length ; j++){
      r+='.'+s.slice(ixs[j-1]+1,ixs[j]+1);
    }
    r+='.'+s.slice(ixs[ixs.length-1]+1,100000);
    return r;
  });
  return ips.filter(is_valid_ip);
}

function is_valid_ip(s){
  var parts = s.split('.');

  if(parts.length!=4){
    return false;
  }
  for(var part of parts){
    if(part.length==0){
      return false;
    }
    if((part*1 > 0)&&(part[0]=='0')){
      return false;
    }
    if(part>255){
      return false;
    }
  }
  return true;
}


function sum_income_anyN(x){
	var minj=0; while((minj<x.length-1)&&(x[minj+1]<x[minj])){minj++};
	if(minj==x.length-1){
		return 0;
	}
	var maxj=x.length-1; while(x[maxj-1]>x[maxj]){maxj--}
	var R = 0;
	var buy = x[minj];
	
	for(var j=minj+1 ; j<maxj ; j++){
		if(x[j+1]<x[j]) { 
			R+=x[j]-buy; 
			buy=x[j+1];
		}
	}
	R+=x[maxj]-buy;
	return R;
}



function all_subixs(N,n){
  if(!Array.isArray(N)){
    N = range(N);
  }
  if(n==N.length){
    return [N];
  }
  if(n==1){
    return N.map(j=>[j]);
  }
  var R = [];
  range(N.length-n+1).forEach(j => {
    all_subixs(N.slice(j+1), n-1).forEach(arr => {
      R.push([N[j]].concat(arr));
    });
  });
  return R;
}




function range(n_min,n_max, step){
  if(n_max===undefined){
    n_max = n_min;
    n_min = 0;
  }
  if(step ===undefined) {
    step = 1;
  }
  if(step==1){
    return [...Array(n_max-n_min).keys()].map(x => x + n_min);
  }else{
    r = [];
    for(var x = n_min ; x<n_max ; x+=step){
      r.push(x);
    }
    return r;
  }
}



function is_valid_parenth(s){
  var n_par = 0;
  for(var j=0 ; j<s.length ; j++){
    if(s[j]=='('){
      n_par++;
    } else if (s[j]==')') {
      n_par--;
    }
    if(n_par < 0){
      return false;
    }
  }
  return n_par == 0; 
}


function all_delstrs(str, n_del){
  var ixss = all_subixs(str.length, str.length - n_del);
  return ixss.map(ixs => ixs.map(j=>str[j]).join(''));
}

function all_valid_fixes(str){
  var sfx = '';
//   while (str[str.length-1]!=')') {
//     if( str[str.length-1]!='(' ){
//       sfx = str[str.length-1] + sfx;
//     }
//     str = str.substr(0,str.length-1)
//   }
  var pfx = '';
//   while (str[0]!='(') {
//     if(str[0]!=')'){
//       pfx = pfx + str[0];
//     }
//     str = str.substr(1,str.length-1)
//   }

  for(var l_del = 1 ; l_del<str.length ; l_del ++){
    var all_strs = all_delstrs(str,l_del);
    var fix_strs = all_strs.filter(is_valid_parenth);

    if(fix_strs.length>0) {
      var tmap = Object.fromEntries(fix_strs.map(s=>[pfx+s+sfx,1]));
      var r = Object.keys(tmap);
      
	  return '['+r.join(',')+']'
    }
  }
  return '[""]';
}




function all_valid_expr(X){
	var SIGNS = ['','-','+','*'];
    var T = X[1];
    var S = X[0];
  
	var R = [];
	for(var j=0; j<4**(S.length-1) ; j++){ 
		var s=combine_strs(S,to_system(j,4,S.length-1).map(x=>SIGNS[x])); 
		var val = eval_(s); 
		if(val==T) {
			//console.log(s);
			R.push(s)
		} 
	} 

	return '['+R.join(',')+']';
}
  
function eval_(s){
	var ts = [...s.matchAll('[0-9]+')].map(x=>x[0]).filter(s=>(s.length>1)&&(s[0]=='0'));
	if (ts.length>0) {
		return Infinity;
	} else 
		return eval(s.replaceAll(/([^0-9]|^)0+([1-9][0-9]+)/g,'$1$2'));
} 
  
function combine_strs(S1,S2){
	var r = '';
	for(var j=0;j<S2.length;j++){
		r+=S1[j]+S2[j];
	}
	return r+S1.slice(S2.length);
}

function to_system(x,base,min_n){
	min_n = min_n || 1;	
	var r = [];

	var n = x;
	while(n>0){
		var t = n % base;
		r.push(t);
		n = (n-t)/base;
	}

	while(r.length<min_n){
		r.push(0);
	}
	return r;
}


function income(prices, transaction_ixs){
  var R = 0;

  for(var j=0;j<transaction_ixs.length ; j+=2){
    R += prices[transaction_ixs[j+1]] - prices[transaction_ixs[j]];
  }

  return R;
}


function compressed_max_income(compressed, max_n){
  if(max_n==0){
    return 0;
  }
  if(compressed.length==2){
    return compressed[1]-compressed[0];
  }
  var max_inc = 0;
  for(var j=0 ; j<compressed.length ; j+=2){
    for(var i=j+1 ; i<compressed.length ; i++){
      var temp = compressed[i]-compressed[j];
      temp = temp + compressed_max_income(compressed.slice(i+1), max_n-1);
      if(temp > max_inc){
        max_inc = temp;
      }
    }
  }
  return max_inc;
}

function sortPropFun(prop, desc){
    var order = desc ? -1 : 1;
    return function(a,b){
        return order*(a[prop] - b[prop])
    }
}


function sum_income (X, num) {
  if (Array.isArray(X[1]) && (num == null)) {
    num = X[0];
    X = X[1];
  }
  if (!num) {
    num = X.length;
  }
  let x = X;

  let minj = 0; while (x[minj + 1] < x[minj]) { minj++; }
  var maxj = x.length - 1; while (x[maxj - 1] > x[maxj]) { maxj--; }
  let buy = x[minj];

  let profits = [];

  let compressed = [x[minj]];

  for (var j = minj + 1; j < maxj; j++) {
    if (x[j + 1] < x[j]) {
      if ((buy !== null) && (x[j] > buy)) {
        profits.push(x[j] - buy);
        compressed.push(x[j]);
      }
      buy = null;
    } else {
      if (buy == null) {
        buy = x[j];
        compressed.push(x[j]);
      }
    }
  }

  compressed.push(x[maxj]);
  if (x[maxj] > buy) {
    profits.push(x[maxj] - buy);
  }
  profits.sort().reverse();
  
  let min = Math.min(...compressed);
  compressed = compressed.map(x => x - min);

  return compressed_max_income(compressed, num);
}


