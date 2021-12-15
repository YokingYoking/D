/** @typedef {import('express').RequestHandler} RequestHandler */

const { Product, Category, Vendor } = require('../models/orm-models.js');


// Shared arguments in Product.findAll for Sequelize ORM.
const include = [ Category, Vendor ];

module.exports = {

  /**
   * Retrieve all of the Products within the database
   * that matches the specified query parameters. Responses
   * with a JSON array of the Products or an error object
   * if none found.
   * 
   * @type {RequestHandler}
   */
  getProducts(req, res) {
    const where = Product.filters(req.query);
    Product.findAll({ include, where }).then((products) => {
      let response = products || new Error('No Products found');
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(response));
      res.end();
    }, console.log);
  },

  /**
   * Retrieve the Product object from the database
   * that matches the specified Product ID. Responses
   * with a JSON object of the matched Product or an
   * error object if not found.
   * 
   * @type {RequestHandler}
   */
  getProductById(req, res) {
    const where = { id: req.params.id };
    Product.findOne({ include, where }).then((product) => {
      let response = product;
      if (!product) res.sendStatus(404);
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(response));
      res.end();
    }, console.log);
  },

  /**
   * Retrieve all of the Products within the database
   * that belong to the specified category. Responses
   * with a JSON array of the Products or an error object
   * if none found.
   *
   * @type {RequestHandler}
   */
  getProductsByCategory(req, res) {
    const where = { catid: req.params.id };
    Product.findAll({ include, where }).then((products) => {
      let response = products;
      if (!products.length) res.sendStatus(404);
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(response));
      res.end();
    }, console.log);
  }
};
