const os = require('os');
const path = require('path');
const Sequelize = require("sequelize");


const dbfile = '4413/pkg/sqlite/Models_R_US.db';
const dbpath = path.join(os.homedir(), ...dbfile.split('/'));

const connection = "sqlite:" + dbpath; // "sqlite:" + "Models_R_US.db"

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
    qty:  Sequelize.INTEGER,
    cost: Sequelize.DOUBLE,
    msrp: Sequelize.DOUBLE,
    catId: Sequelize.INTEGER,
    venId: Sequelize.INTEGER
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
    },


    retrieveAllProducts(req, res) {
        Product.findAll({}).then((results) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
        })
    },

    retrieveProductById(req, res) {
        const id = req.params.id;

        Product.findOne({where: {id: id}}).then((products) => {
            if(products) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(products));
            } else {
                res.sendStatus(404);
            }
        })
    },

    retrieveProductsByCategory(req, res) {
        const categoryId = parseInt(req.params.id);

        Product.findAll({where: {catId: categoryId}}).then(results => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(results));
        })
    },

    retrieveCarts(req, res) {
        if(!req.session.cart) {
            req.session.cart = []
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.session.cart));
    },

    updateCarts(req, res) {
        if(!req.session.cart) {
            req.session.cart = []
        }

        // parse the req body
        if(req.body && req.body.id && req.body.qty) {

            let productId = req.body.id;
            let productQty = req.body.qty;
            if(typeof productQty != "number") {
                res.sendStatus(400);
                return;
            }

            let index = -1;
            for(let i=0;i<req.session.cart.length;i++) {
                if(req.session.cart[i]["id"] === productId) {
                    index = i;
                    break;
                }
            }
            // no such products in the list
            if(index === -1) {
                if(productQty > 0) {
                    // find the product
                    Product.findOne({where: {id: productId}}).then(result => {
                        if(result) {
                            req.session.cart.push({"id": productId, "qty": productQty});
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(req.session.cart));
                        } else {
                            res.sendStatus(400);
                        }
                    })
                }
            } else {
                // contain such product
                if(productQty <= 0) {
                    req.session.cart.splice(index, 1);
                } else {
                    req.session.cart[index]["qty"] = productQty;
                }
            }
        } else {
            res.sendStatus(400);
        }
    },

    searchProduct(req, res) {

        const searchTerm = req.query.searchText;
    
        if(searchTerm) {
            Product.findAll({where: {description: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('description')), 'LIKE', '%'+searchTerm+'%')}}).then(results => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(results));
            })
        } else {
            this.retrieveAllProducts(req, res);
        }
    }
}



