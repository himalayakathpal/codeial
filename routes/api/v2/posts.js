const express = require('express');

const router = express.Router();
const postsApi = require("../../../controllers/api/v2/posts_api");

router.use('/',postsApi.index);
module.exports = router;