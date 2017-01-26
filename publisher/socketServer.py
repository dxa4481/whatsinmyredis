import SocketServer, redis

r = redis.StrictRedis(host='redis', port=6379, db=0)


class MyTCPHandler(SocketServer.BaseRequestHandler):
    """
    The request handler class for our server.

    It is instantiated once per connection to the server, and must
    override the handle() method to implement communication to the
    client.
    """

    def handle(self):
        # self.request is the TCP socket connected to the client
        self.data = ""
        for i in range(50):
            new_data = self.request.recv(1024).strip()
            self.data += new_data
            if len(new_data) < 1024:
                break
        self.process_data(self.client_address[0], self.data)
        # just send back the same data, but upper-cased
        self.request.sendall("hi")

    def process_data(self, ip_address, data):
        data = str(data)
        if "RESTORE" not in data:
            return
        try:
            token = data.split("RESTORE")[1].split("\n")[2].strip()
            data = "".join(data.split("RESTORE")[1].split("\n")[5:])
        except:
            return
        r.publish(token, data)
        print "Token: " + token
        print "Data: " + data


if __name__ == "__main__":
    HOST, PORT = "0.0.0.0", 11111

    # Create the server, binding to localhost on port 9999
    server = SocketServer.TCPServer((HOST, PORT), MyTCPHandler)

    # Activate the server; this will keep running until you
    # interrupt the program with Ctrl-C
    print "Starting Server"
    server.serve_forever()
