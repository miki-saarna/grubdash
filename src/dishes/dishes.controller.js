const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if(foundDish === undefined) {
        next({ status: 404, message: `Dish does not exist: ${dishId}` })
    } else {
        res.locals.dishId = dishId;
        res.locals.dish = foundDish;
        next();
    }
}

function dishIsValid(req, res, next) {
    const { data } = req.body;
    if (!data.name) next({ status: 400, message: `Dish must include a name`})
    if(!data.description) next({ status: 400, message: `Dish must include a description`})
    if(!data.price && data.price !== 0) next({ status: 400, message: `Dish must include a price`})
    if(!data.image_url) next({ status: 400, message: `Dish must include an image_url`})
    if(!Number.isInteger(data.price) || data.price <= 0) next({ status: 400, message: `Dish must have a price that is an integer greater than 0`})
    if(data.id && data.id !== res.locals.dishId) next({ status: 400, message: `Dish id does not match route id. Dish: ${data.id}, Route: ${res.locals.dishId}` })
        res.locals.newDish = data;
        next(); 
}



function list (req, res, next) {
    res.json({ data: dishes });
}

function create (req, res, next) {
    const { name, description, price, image_url } = res.locals.newDish;
    const newDish = {
        id: nextId(),
        name: name,
        description: description,
        price: price,
        image_url: image_url,
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}
        
function read (req, res, next) {
    res.json({ data: res.locals.dish })
}

function update (req, res, next) {
    const data = res.locals.newDish;
    const index = dishes.findIndex((dish) => dish.id === res.locals.dishId);
    dishes[index] = {
        ...dishes[index],
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.image_url,
    }
    console.log(data)
    res.json({ data: dishes[index] });
}


module.exports = {
    list,
    create: [dishIsValid, create],
    read: [dishExists, read],
    update: [dishExists, dishIsValid, update]
}