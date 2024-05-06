const checkFileSize = async (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(413).send({
        status: 413,
        message: 'File is too large ,only upload files less than 2MB'
      })
  }
  next()
};

module.exports = checkFileSize;