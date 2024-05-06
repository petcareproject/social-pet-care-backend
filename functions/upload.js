
const multer = require('multer')
const mongoose = require('mongoose');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file && file?.fieldname === 'imageFile') {
      cb(null, './public/uploads/pets')
    } else {
      cb(null, './public/uploads/users')
    }
  },
  
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.substr(file.originalname.lastIndexOf('.') + 1, file.originalname.length);
    let data;
    if (file && file?.fieldname === 'imageFile') {
      data = mongoose.Types.ObjectId()
    } else {
      data = req?.user?._id
    }
    cb(null, `${data}.${fileExtension}`)
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    req.fileValidationError = "Please upload valid image format";
    return cb(null, false, req.fileValidationError);
  }

}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});

module.exports = upload;