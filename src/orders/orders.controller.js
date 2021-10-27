const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
    const { orderId } = req.params;
    console.log(orderId)
    const foundOrder = orders.find(order => order.id === orderId);
    if(foundOrder === undefined) {
        next({ status: 404, message: `Order does not exists: ${orderId}` })
    } else {
        res.locals.orderId = orderId;
        res.locals.order = foundOrder;
        next();
    }
}

function orderIsValid(req, res, next) {
    const { data } = req.body;
    if(!data.deliverTo) next({ status: 400, message: `Order must include a deliverTo`});
    if(!data.mobileNumber) next({ status: 400, message: `Order must include a mobileNumber`});
    if(data.dishes === undefined) next({ status: 400, message: `Order must include a dish`});
    if(!data.dishes.length || !Array.isArray(data.dishes)) next({ status: 400, message: `Order must include at least one dish`});
    // if(!data.price && data.price !== 0) next({ status: 400, message: `Order must include a deliverTo`});
    (data.dishes).forEach((dish, index) => {
        if(dish.quantity === undefined || !Number.isInteger(dish.quantity) || dish.quantity <= 0) {
            next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`})
        }
    })
    res.locals.newOrder = data;
        next(); 
}

function additionalOrderValidation(req, res, next) {
    const order = res.locals.newOrder;
    const originalOrder = res.locals.order;
    if(order.id && order.id !== originalOrder.id) next({ status: 400, message: `Order id does not match route id. Order: ${order.id}, Route: ${originalOrder.id}` });
    if(!order.status) return next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered` });
    if(originalOrder.status === "delivered") return next({ status: 400, message: `A delivered order cannot be changed` });
    if(order.status !== "pending" && order.status !== "preparing" && order.status !== "out-for-delivery" && order.status !== "delivered") return next({ status: 400, message: `status is an invalid input` })
    next();
}




function list(req, res, next) {
    res.json({ data: orders })
}

function create(req, res, next) {
    const newOrder = { id: nextId(), ...res.locals.newOrder };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder })
}

function read(req, res, next) {
    res.json({ data: res.locals.order })
}

function update(req, res, next) {
    const { deliverTo, mobileNumber, status, dishes } = res.locals.newOrder;
    const index = orders.findIndex((order) => order.id === res.locals.orderId);
    orders[index] = {
        ...orders[index],
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        status: status,
        dishes: dishes
    }
    res.json({ data: orders[index] })
}

function destroy(req, res, next) {
    const orderToDelete = res.locals.order;
    if(orderToDelete.status !== "pending") return next({ status: 400, message: `An order cannot be deleted unless it is pending` })
    const index = orders.findIndex((order) => order.id === res.locals.order.id);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [orderIsValid, create],
    read: [orderExists, read],
    update: [orderExists, orderIsValid, additionalOrderValidation, update],
    delete: [orderExists, destroy],
}