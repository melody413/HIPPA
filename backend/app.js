var express = require("express");

var app = express();
app.use(express.static("frontend"));

app.get("*", function(req, res) {
    res.sendfile("frontend/index.html");
});

app.listen(8000);
