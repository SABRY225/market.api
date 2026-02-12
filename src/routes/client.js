const express = require('express');
const controller = require('../controllers/clientController');
const { fetchOffers, fetchProducts, fetchOfferDetails, fetchProductDetails } = require('../controllers/menuController');
const authToken = require('../middleware/authToken');
const router = express.Router();

router.get("/cart", authToken, controller.getCartItems);
router.get("/favorites", authToken, controller.getFavorites);
router.get('/:id', controller.getUserInfo);
router.get('/orders/:id', controller.getUserOrders);
router.get('/orders', controller.getUserOrders);
router.get('/top-reviews', controller.topReviews);

router.get('/products', fetchProducts);
router.get("/products/:id", fetchProductDetails);
router.get('/offers', fetchOffers);
router.get("/offers/:id", fetchOfferDetails);
router.get('/restaurants', controller.topResturant);
router.get("/restaurants/:vendorId", controller.fetchRestaurantDetails);

router.post('/login', controller.login);
router.post('/send-code', controller.sendCode);
router.post('/forget-password', controller.forgetPassword);
router.post('/register', controller.registerCustomer);


router.post("/cart", authToken, controller.addToCart);
router.put("/cart/:itemId", authToken, controller.updateCartItem);
router.delete("/cart/:itemId", authToken, controller.deleteCartItem);
router.delete("/cart", authToken, controller.clearCart);

router.post("/favorites", authToken, controller.addToFavorite);
router.delete("/favorites/:id", authToken, controller.deleteFavorite);

router.post("/checkout", authToken, controller.checkout);




module.exports = router;
