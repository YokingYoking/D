const os = require('os');
const path = require('path');
const Sequelize = require("sequelize");


const dbfile = '4413/pkg/sqlite/Models_R_US.db';
const dbpath = path.join(os.homedir(), ...dbfile.split('/'));

const connection = "sqlite:" + dbpath; //   "sqlite:" + "Models_R_US.db";

const sequelize = new Sequelize(connection, {
    operatorsAliases: false,
    freezeTableName: true,
    timestamp: false
});

// define model

// Category model
const Category = sequelize.define('Category', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true,
    timestamps: false
});

// Vendor
const Vendor = sequelize.define('Vendor', {
    id: {type: Sequelize.INTEGER, primaryKey: true},
    name: {type: Sequelize.STRING, allowNull: false}
}, {
    freezeTableName: true,
    timestamps: false
});

// Products
const Product = sequelize.define('Product', {
    id:   {
        type: Sequelize.STRING,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: Sequelize.TEXT,
    catId: Sequelize.INTEGER,
    venId: Sequelize.INTEGER,

    qty:  Sequelize.INTEGER,
    cost: Sequelize.DOUBLE,
    msrp: Sequelize.DOUBLE,
    category: {
        type: Sequelize.VIRTUAL,
        get() {
            return this.Category?.get().name;
        }
    },
    vendor: {
        type: Sequelize.VIRTUAL,
        get() {
            return this.Vendor?.get().name;
        }
    },
}, {
    freezeTableName: true,
    timestamps: false
});




module.exports = {

    getCatalog(req, res) {
        if (req.query.id) {
            id = parseInt(req.query.id);
            Category.findAll({where: {id: id}}).then((result) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
            })
        } else {
            Category.findAll({}).then((results) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(results));
            })
        }
    }

}



