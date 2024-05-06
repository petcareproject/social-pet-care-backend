const express = require("express");

const validateToken = require("../middleware/validateTokenHandler");

const checkFileSize = require("../middleware/checkFileUploadError");

const upload = require("../functions/upload");

const { registerPet, getPetList, getPetDetail, editPet } = require("../controller/petController");
const router = express.Router();

router.post("/register", validateToken, upload.array('imageFile'), checkFileSize, registerPet);

router.put("/edit/:id", validateToken, upload.array('imageFile'), checkFileSize, editPet);

router.get("/pet-list", validateToken, getPetList);

router.get("/pet-detail/:id", validateToken, getPetDetail);

module.exports = router;
