function express() {
    var http = require("http");
    function constructor(req, res) {
        res.statusCode = 404;
        res.end();
    } 
    constructor.listen = function(port, callback) {
        return http.createServer(this).listen(port, callback);
    }
    return constructor;
}

module.exports = express;
