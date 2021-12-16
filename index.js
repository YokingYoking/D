const express = require("express");
const session = require("express-session");
const dao = require("./dao.js");


const app = express();
const port = process.argv[2] || 3000;

app.enable("trust proxy")
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    proxy: true
}));
app.use(express.json());

app.get('/api/catalog', function (req, res) {
    dao.getCatalog(req, res);
});

app.get("/api/products/category/:id", function(req, res) {
    dao.retrieveProductsByCategory(req, res);
});

app.get("/api/products/:id", function(req, res) {
    dao.retrieveProductById(req, res);
});

app.get("/api/products", function(req, res) {
    dao.retrieveAllProducts(req, res);
});

app.get("/api/cart", function(req, res) {
    dao.retrieveCarts(req, res);
})

app.post("/api/cart/update", function (req, res) {
    dao.updateCarts(req, res);
})

app.get("/api/searchDescription", function (req, res) {
    dao.searchProduct(req, res);
})




const server = app.listen(port, function () {
    const host = server.address().address;
    const port = server.address().port;
    console.log(`server listening to ${host}:${port}`);
});