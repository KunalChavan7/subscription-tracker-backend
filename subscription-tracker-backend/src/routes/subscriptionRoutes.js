const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/subscriptionController");

router.use(auth);

router.post("/", c.create);
router.get("/", c.list);
router.post("/:id/pay", c.markPaid);
router.get("/:id/payments", c.listPayments);
router.get("/:id", c.getOne);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;