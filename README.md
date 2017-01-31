## Whatsinmyredis.com
Redis <3.2.7 suffers from CSRF issues which allows an attacker to run arbitrary redis commands on local/internal redis instances. These attacks have been mitagated in the latest versions of redis. Demoed on this website is the ability to migrate all redis keys from an internal network to an attacker controlled server. Additionally, the ability to encrypt all of the contents of local redis instances is also demoed, which could be leveraged to ransomeware a person or company.
[http://whatsinmyredis.com](http://whatsinmyredis.com)
![whatsinmyredis](https://i.imgur.com/KXxTPID.png)

## How is Redis vulnerable to CSRF?

Redis does not use HTTP to communicate, it uses its own redis ascii, newline delaminated protocol via TCP. One unfortunate property of this protocol is it does not terminate TCP connection when invalid commands are sent to it. This allows for a cleartext HTTP request to be sent to a listening Redis server. Redis will ignore the HTTP headers, and as soon as it sees a valid redis command in the body, it will execute it. Below is an example of running the migrate command on all keys in the redis store. 

![image2](https://i.imgur.com/t98hQ9h.png)

Note the use of lua script EVAL. Redis supports Lua script, which is a turing complete programming language, sandboxed in the redis environment. 

More info on redis CSRF is available [here](http://www.agarri.fr/kom/archives/2014/09/11/trying_to_hack_redis_via_http_requests/index.html)

## How can you encrypt redis contents?

As mentioned above, lua script is turing complete. This allows an attacker to implement their own crypto via lua script and send it over to the victim. In this example, bad crypto is used for the purpose of demonstration. An XOR "one time" pad is generated in Javascript, and is used to XOR all contents in redis. This encryption key can then be sent to a malicious server, and can be used to ransom the victims.

![imge3](https://i.imgur.com/U0FgIeE.png)

## Impact

Because WEBRTC [exposes internal IP addresses](https://diafygi.github.io/webrtc-ips/) it's very easy to sweep an entire /24 or /16 from a single user clicking a malicious link. This means if one victim at a company clicks an evil link, every redis instance exposed on the victims network can fall victim to ransomware, data exfiltration, and in [certain cases](https://github.com/dxa4481/Damn-Vulnerable-Redis-Container) Remote Code Execution.

## How can you protect yourself?

Upgrade to Redis <3.2.7 and consider putting authentication on your redis, and [pipping it through Stunnel](http://bencane.com/2014/02/18/sending-redis-traffic-through-an-ssl-tunnel-with-stunnel/)

## FAQ

##### The site doesn't work for me, why?
There are a number of reasons it may not work, some listed below
+ The site uses outbound port 11111 for the data exfiltration, this port may be blocked
+ The site utilizes redis commands introduced in 2.6.0 so older versions will fail
+ The website needs websocket support to work

##### Why isn't there TLS on the site?
The site needs to make unencrypted requests to redis, and because mixed contents errors would get thrown otherwise, there is no TLS on the website

##### Do you save any of the data?
No. The data is temperarily sent to a GCE server, which is used to send that data back to the client via websocket

##### Why do you need to send the data back to the server?
Once the malformed "HTTP" response is sent from the redis database to the browser, the browser throws a malformed HTTP response error.

##### I messed up and encrypted data I need, what now?
Fortunetly I'm using really bad crypto here, so you have some options. If you haven't refreshed, hit the encrypt button again, and it will XOR the redis contents with the same key, and your data will be recovered. The decryption key is also saved in the redis key "WIMREncryptionKey". If you encrypted the contents multiple times with multiple keys, there's still hope. If you know what any of the values in the database used to be, you can XOR that value with that current encrypted key to recover your new decryption key. 

## Special thanks
After working with the lead Redis developer Antirez, the CSRF patch was backported to 3.2.7, he was very responsive and helpful!
