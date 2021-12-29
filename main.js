




function sum_income_anyN(x){
  var minj=0; while(x[minj+1]<x[minj]){minj++};  
  var maxj=x.length-1; while(x[maxj-1]>x[maxj]){maxj--}
var R = 0;
var buy = x[minj];
   
for(var j=minj+1 ; j<maxj ; j++){
  if(x[j+1]<x[j]) { R+=x[j]-buy; buy=x[j+1];}
}
 R+=x[maxj]-buy;
return R;
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
  console.log(compressed);
  let min = Math.min(...compressed);
  compressed = compressed.map(x => x - min);

  console.log(compressed);

  return compressed_max_income(compressed, num);s

  let combined = [];
  let cur_arr = [compressed.slice(0, 2)];
  for (var j = 2; j < compressed.length; j += 2) {
    let low = compressed[j];
    let high = compressed[j + 1];

    if ((low < compressed[j - 2]) || (high < compressed[j - 1])) {
      combined.push(cur_arr);
      cur_arr = [[low,high]];
    } else {
      cur_arr.push([low, high]);
    }
  }
  combined.push(cur_arr)

  // console.log(combined);
  combined.map(arrs => arrs.map(arr => [arr[0]-arrs[0][0],arr[1]-arrs[0][0]]));
  
  console.log('combined=' + combined.tostr());
  console.log('----');



  var maxs = [];
  for(var n_tr=1;n_tr <= Math.min(num, compressed.length/2) ; n_tr++){
    var max_income = 0;
    for(var ixs of all_subixs_iter(compressed.length, n_tr*2)){
      var temp = income(compressed, ixs);
      if (temp > max_income) {
        max_income = temp;
      }
    }
    //console.log(ixss);
    //console.log(incomes);
    maxs.push(max_income);
    console.log('For '+n_tr+' transactions max income:' + maxs[maxs.length-1]);
  }
  console.log('-- overall max:'+Math.max(...maxs));
  return Math.max(...maxs);

  console.log('----');
  combined.forEach(arrs => {
    if (arrs.length == 1 ){
      console.log(arrs[0][1]-arrs[0][0]);
    } else if (arrs.length == 2) {
      console.log( [arrs[1][1]-arrs[0][0], arrs.map(arr=>arr[1]-arr[0])]);
    } else  {
      console.log( arrs.map(arr=>[arr[1]-arr[0]]).join(',') + " ; original: "+arrs.tostr());
    }
  })

  console.log('----');

  if(Math.max(...combined.map(arrs=>arrs.length)) == 1){

    var max_profit = combined.map(arrs => arrs[0][1]-arrs[0][0]).sort_desc().slice(0, num).sum();

    console.log('Simple case, max with '+num+' transactions is :'+max_profit);
  }
  

  return profits.slice(0, num).reduce((a, b) => a + b);
}

function income(prices, transaction_ixs){
  var R = 0;

  for(var j=0;j<transaction_ixs.length ; j+=2){
    var add = prices[transaction_ixs[j+1]] - prices[transaction_ixs[j]];
    if(add <= 0){
      return 0;
    }
    R += add;
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
    for(var i=j+1 ; i<compressed.length ; i+=2){
      var temp = compressed[i]-compressed[j];
      temp = temp + compressed_max_income(compressed.slice(i+1), max_n-1);
      if(temp > max_inc){
        max_inc = temp;
      }
    }
  }
  return max_inc;
}

Array.prototype.sort_desc = function(){
  return this.sort((a,b)=>b-a);
}

Array.prototype.tostr = function(){
  return JSON.stringify(this);
}

Array.prototype.sum = function(){
  return this.reduce((a,b) => a+b);
}

Array.prototype.max = function(){
  var r = this[0];
  for(var j=1;j<this.length;j++){
    if(this[j]>r){
      r = this[j];
    }
  }
  return r;
}

function pyramid_min_sum_path(x){ 
  for (var y=x.length-2;y>=0;y--){
    for(var j=0;j<x[y].length;j++){
      x[y][j] += Math.min(x[y+1][j],x[y+1][j+1]);
    }
}
return x[0][0];
}

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

  console.log(X);

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
    console.log(X);
  }
  return X[h - 1][w - 1];
}


x = []

function tilt(m){
	return [...Array(m[0].length).keys()].map(j=>m.map(a=>a[a.length-j-1]))
}

function spiral_(m){
	return (m.length==1)? m : m[0].concat(spiral_(tilt(m.slice(1))))
}

function spiral(x){
  console.log('['+spiral_(x).join(', ')+']')
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



function all_valid_expr(S,T){

  if(Array.isArray(S) && (T===undefined)){
    T = S[1];
    S = S[0];
  }
  
  var R = [];
  for(var j=0; j<4**(S.length-1) ; j++){ 
    var s=combine_strs(S,to_system(j,4,S.length-1).map(x=>SIGNS[x])); 
    var val = eval(s); 
    if(val==T) {
      console.log(s);
      R.push(s)
    } 
  } 
  
  console.log('['+R.join(',')+']');
}
  
  SIGNS = ['','-','+','*'];
  
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

function* all_subixs_iter(N,n){
  if(!Array.isArray(N)){
    N = range(N);
  }
  if(n==N.length){
    yield [N];
    return;
  }
  if(n==1){
    for(var j of N){
      yield [j];
    }
    return;
  }
  for(var j=0 ; j<N.length-n+1 ; j++){
    for(var arr of all_subixs_iter(N.slice(j+1), n-1)){
      yield [N[j]].concat(arr);
    }
  }
}

function all_delstrs(str, n_del){
  var ixss = all_subixs(str.length, str.length - n_del);
  return ixss.map(ixs => ixs.map(j=>str[j]).join(''));
}

function all_valid_fixes(str){

  var sfx = '';
  while (str[str.length-1]!=')') {
    if( str[str.length-1]!='(' ){
      sfx = str[str.length-1] + sfx;
    }
    str = str.substr(0,str.length-1)
  }
  var pfx = '';
  while (str[0]!='(') {
    if(str[0]!=')'){
      pfx = pfx + str[0];
    }
    str = str.substr(1,str.length-1)
  }

  for(var l_del = 1 ; l_del<str.length ; l_del ++){
    var all_strs = all_delstrs(str,l_del);
    var fix_strs = all_strs.filter(is_valid_parenth);

    if(fix_strs.length>0) {
      var tmap = Object.fromEntries(fix_strs.map(s=>[pfx+s+sfx,1]));
      var r = Object.keys(tmap);
      console.log('['+r.join(',')+']');
      return r
    }
  }
  console.log('[""]');
  return [""];
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


function subarray_with_max_sum(arr){
  var ixss = all_subixs(arr.length+1,2);
  var sums = ixss.map(ixs => arr.slice(ixs[0],ixs[1]).sum());
  return sums.max();
}


function n_ways_to_sum(N,max_part){
  console.log('n_ways_to_sum : N='+N+' max_part='+max_part);
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
      console.log('..so '+N+' = '+max_+' + .. -> '+temp+' ways'+(((N-max_) <= max_) ? ' , including '+max_+' + '+(N-max_) : ''));
      R += temp;
    }
  }
  console.log('n_ways_to_sum : N='+N+' max_part='+max_part+' => '+R+'ways');

  return R;
}

function largest_prime_factor(N){
  var primes = {2:1,3:1,5:1,7:1,9:1};
  var max_test = Math.sqrt(N);
  for(var test=2 ; test < max_test ; test ++ ){
    if(!primes.hasOwnProperty(test)){
      var test_is_prime = true;
      for (var j in primes) { 
        if((test!=j)&&(test % j == 0)){
          test_is_prime = false;
          break;
        }
      }
      if(test_is_prime){
        primes[test] = 1;
      }
    }
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