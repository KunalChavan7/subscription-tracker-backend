const router = require("express").Router();
const auth = require("../middleware/auth");
const { get, update } = require("../controllers/settingsController");

router.use(auth);
router.get("/", get);
router.patch("/", update);

module.exports = router;