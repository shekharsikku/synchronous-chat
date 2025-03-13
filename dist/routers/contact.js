"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const contact_1 = require("../controllers/contact");
const router = (0, express_1.Router)();
router.get("/search", middlewares_1.authAccess, contact_1.searchContact);
router.get("/fetch", middlewares_1.authAccess, contact_1.fetchContacts);
router.get("/fetch/:id", middlewares_1.authAccess, contact_1.fetchContact);
router.get("/available", middlewares_1.authAccess, contact_1.availableContact);
exports.default = router;
