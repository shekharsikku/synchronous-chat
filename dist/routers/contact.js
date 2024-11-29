"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const contact_1 = require("../controllers/contact");
const router = (0, express_1.Router)();
router.post("/search", middlewares_1.authAccess, contact_1.searchContact);
router.get("/fetch", middlewares_1.authAccess, contact_1.fetchContacts);
exports.default = router;
