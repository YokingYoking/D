/** @typedef {import('express').RequestHandler} RequestHandler */

const { Category } = require('../models/orm-models');


module.exports = {
  /**
   * @type {RequestHandler}
   */
  getCategory(req, res) {
    let where = {};
    if (req.query.id) {
      where = {
        id: +req.query.id
      };
    }

    Category.findAll({ where }).then((categories) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(categories));
    });
  }
};
