const router = require("express").Router();
const auth = require("../middleware/auth");
const { summary } = require("../controllers/dashboardController");

router.use(auth);
router.get("/summary", summary);

module.exports = router;