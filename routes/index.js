const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs');

router.get("/", function (req, res) {
  res.redirect("/products");
});

router.get("/map/:orderid", function (req, res) {
  res.render("map", { orderid: req.params.orderid });
});

module.exports = router;
