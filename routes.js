
const products = require('./controllers/products');
const category = require('./controllers/category');
const cart     = require('./controllers/cart');


module.exports = {
  configureRoutes(app) {
    app.get('/api/products',              products.getProducts);
    app.get('/api/catalog',               category.getCategory);
    app.get('/api/products/category/:id', products.getProductsByCategory);
    app.get('/api/products/:id',          products.getProductById);
    app.get('/api/cart',                  cart.getCart);
    app.post('/api/cart/update',          cart.updateCart);
  }
};
