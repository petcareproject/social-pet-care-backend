const fs = require('fs')
module.exports.generatePassword = () => {
    try {
        let length = 12,
            charset = "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 @/\_-&*#$!()",
            charsetArr = charset.split(' ');
        let retVal = "";
        charsetArr.forEach(chars => {
            for (let i = 0, n = chars.length; i < length / charsetArr.length; ++i) {
                retVal += chars.charAt(Math.floor(Math.random() * n));
            }
        })
        return retVal;
    } catch (error) {
        throw error;
    }
};

module.exports.paginationQuery = (data) => {
    try {
        let page = parseInt(data?.page) || 1;
        const pageSize = parseInt(data?.limit) || 10;
        const skip = (page - 1) * pageSize;

        return {
            page,
            pageSize,
            skip
        }
    } catch (error) {
        throw error
    }
};

module.exports.pagination = (data) => {
    try {
        let obj = {}
        const totalPages = Math.ceil(data.total / data.pageSize);

        if (data.page > totalPages) {
            data.page = 1
        }

        obj = {
            page: data.page,
            hasPrevious: data.page > 1,
            previous: data.page - 1,
            hasNext: data.page < totalPages,
            next: data.page < totalPages ? data.page + 1 : data.page,
            totalPages
        }

        return obj
    } catch (error) {
        throw error
    }
};


module.exports.getImage = async (imageFile) => {
    try {
        const promise = await fs.readFileSync(`./public/uploads/${imageFile}`);
        const base64String = `data:buffer;base64,${Buffer.from(promise).toString(
            "base64"
        )}`;
        return base64String;
    } catch(error) {
        return 'error';
    }
    
} 
