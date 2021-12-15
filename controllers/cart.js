/** @typedef {import('express').RequestHandler} RequestHandler */

const _           = require('lodash');
const { Product } = require('../models/orm-models.js');


module.exports = {

  /**
   * Retrieve the array of Cart entries that are the items and
   * their quantities within the shopping cart for the current session.
   * Responses with a JSON array of Cart object.
   * 
   * @type {RequestHandler}
   */
  getCart(req, res) {
    req.session.cart = req.session.cart || [];
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(req.session.cart));
    res.end();
  },

  /**
   * Update the array of Cart entries given the item and
   * its quantities within the shopping cart for the current session.
   * If the quantity is not positive, it is deleted.
   * Responses with the updated Cart as a JSON array of Cart objects.
   * 
   * @type {RequestHandler}
   */
  updateCart(req, res) {
    req.session.cart = req.session.cart || [];
    if (!req.body || typeof req.body !== 'object' || !req.body.id || typeof req.body.qty !== 'number')  {
      res.sendStatus(400);
    } else {
      const { id, qty } = req.body;
      const index = _.findIndex(req.session.cart, { id });
      if (index >= 0) {
        if (qty > 0) {
          req.session.cart[index].qty = qty;
        } else {
          req.session.cart.splice(index, 1);
        }
      } else {
        if (qty > 0) {
          Product.findOne({ where: { id } }).then((product) => {
            if (product) {
              req.session.cart.push({ id, qty });
            } else {
              res.sendStatus(400);
            }
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(req.session.cart));
            res.end();
          });
          return;
        }
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(req.session.cart));
    res.end();
  }
};
