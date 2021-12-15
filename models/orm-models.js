
const os     = require('os');
const path   = require('path');
const config = require('../config.js');

const { Sequelize, DataTypes, Op } = require('sequelize');


const dbfile  = config.db;
const dbpath  = path.join(os.homedir(), ...dbfile.split('/'));
const dbconf  = config.sequelize;

const sequelize = new Sequelize('sqlite:' + dbpath, dbconf);

const Category = sequelize.define('Category', {
  id:   { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false }
});

const Vendor = sequelize.define('Vendor', {
  id:   { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false }
});

const Product = sequelize.define('Product', {
  id:   { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  catId: DataTypes.INTEGER,
  venId: DataTypes.INTEGER,
  description: DataTypes.TEXT,
  qty:  DataTypes.INTEGER,
  cost: DataTypes.DOUBLE,
  msrp: DataTypes.DOUBLE,
  category: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.Category?.get().name;
    }
  },
  vendor: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.Vendor?.get().name;
    }
  },
});

function manyToOneRelation(many, one, foreignKey) {
  many.belongsTo(one, { foreignKey });
  one.hasMany(many,   { foreignKey });
}

manyToOneRelation(Product, Category, 'catId');
manyToOneRelation(Product, Vendor, 'venId');

const conditionFactories = {
  likeCondition(field, value) {
    let column = sequelize.col(`Product.${field}`);
    let upper  = sequelize.fn('UPPER', column);
    let regex  = '%' + value.toUpperCase() + '%';
    return {
      [field]: sequelize.where(upper, 'LIKE', regex)
    };
  },
  referenceCondition(table, value) {
    return {
      [`$${table}.name$`]: value
    };
  },
  inequalityCondition(field, inequality, value) {
    return {
      [field]: {
        [inequality]: +value
      }
    };
  }
};

const conditions = {
  id(v)          { return { id: v }; },
  name(v)        { return conditionFactories.likeCondition('name', v); },
  description(v) { return conditionFactories.likeCondition('description', v); },
  category(v)    { return conditionFactories.referenceCondition('Category', v); },
  vendor(v)      { return conditionFactories.referenceCondition('Vendor', v); },
  min_cost(v)    { return conditionFactories.inequalityCondition('cost', Op.gte, v) },
  min_msrp(v)    { return conditionFactories.inequalityCondition('msrp', Op.gte, v) },
  min_qty(v)     { return conditionFactories.inequalityCondition('qty',  Op.gte, v) },
  max_cost(v)    { return conditionFactories.inequalityCondition('cost', Op.lte, v) },  
  max_msrp(v)    { return conditionFactories.inequalityCondition('msrp', Op.lte, v) },
  max_qty(v)     { return conditionFactories.inequalityCondition('qty',  Op.lte, v) },
};

// Extend Product object with a filters method.
Product.filters = function (queries) {
  return {
    [Op.and]: Object.keys(queries).map(k => conditions[k](queries[k]))
  };
};

module.exports = {
  Product,
  Category,
  Vendor
};
