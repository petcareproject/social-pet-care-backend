const Pet = require("../models/petModel");
const moment = require("moment");
const mongoose = require('mongoose');
const { paginationQuery, pagination, getImage } = require("../functions/common");
//@desc Register a user
//@route POST /api/users/register
//@access public

const registerPet = async (req, res) => {
  try {
    if (req?.fileValidationError) {
      return res.status(400).send({
        status: 400,
        message: req.fileValidationError,
      });
    }

    let obj = {
      petName: req?.body?.petName.trim(),
      petCategory: req?.body?.petCategory ? req?.body?.petCategory.toLowerCase().trim() : req?.body?.petCategory,
      gender: (req?.body?.gender).toLowerCase(),
      petBreeds: req?.body?.petBreads ? req?.body?.petBreads.toLowerCase().trim() : req?.body?.petBreads,
      dob: moment(new Date(req?.body?.dob)).format("YYYY-MM-DD[T00:00:00.000Z]"),
      location: req?.body?.location,
      address: req?.body?.address,
      aboutPets: req?.body?.aboutPets,
      uploadedBy: req.user._id,
    };

    const ageDiffInYears = moment().diff(moment(obj['dob']), 'years', true)
    if (parseInt(ageDiffInYears) <= 0) {
      const ageDiffInMonths = moment().diff(moment(obj['dob']), 'months', true)
      if (parseInt(ageDiffInMonths) <= 0) {
        const ageDiffInDays = moment().diff(moment(obj['dob']), 'days', true)
        if (parseInt(ageDiffInDays) <= 0) {
          obj['age'] = "1"
        } else {
          if (!Number.isInteger(ageDiffInDays)) {
            obj['age'] = String(`${(Math.trunc(ageDiffInDays))}+ days`)
          } else {
            obj['age'] = String(`${Math.trunc(ageDiffInDays)} days`)
          }
        }
      } else {
        if (!Number.isInteger(ageDiffInMonths)) {
          obj['age'] = String(`${(Math.trunc(ageDiffInMonths))}+ months`)
        } else {
          obj['age'] = String(`${Math.trunc(ageDiffInMonths)} months`)
        }
      }

    } else {
      if (!Number.isInteger(ageDiffInYears)) {
        obj['age'] = String(`${(Math.trunc(ageDiffInYears))}+ years`)
      } else {
        obj['age'] = String(`${Math.trunc(ageDiffInYears)} years`)
      }
    }

    if (req.files && req?.files?.length) {
      let fileArray = []
      for (let data of req.files) {
        fileArray.push(`pets/${(data.filename).trim()}`)
      }
      obj["petProfile"] = fileArray;
    }
    await Pet.create(obj);
    return res
      .status(201)
      .send({ status: 201, message: "Pet created successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const getPetList = async (req, res) => {
  try {
    let condition = {
      isDeleted: false
    };
    const paginationData = await paginationQuery(req.query);
    let search = req?.query?.search
    if (search) {
      search = search.trim().toLowerCase()
      condition = { ...condition, '$or': [] }
      condition['$or'].push({
        petBreeds: {
          '$regex': search,
          '$options': 'i'
        }
      },
        {
          petCategory: search
        }
      )
    }


    let [petData, totalCount] = await Promise.all([
      Pet.find(condition).skip(paginationData.skip).limit(paginationData.pageSize),
      Pet.countDocuments(condition),
    ]);

    let obj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
    };

    obj["total"] = totalCount;
    const getPagination = await pagination(obj);

    if (petData.length) {
      for (let data of petData) {
        if (data?.petProfile?.length) {
          const imgBuff = await getImage(data.petProfile[0])
          if (imgBuff === 'error') {
            return res.status(404).send({ message: 'Profile not found' })
          }
          data['petProfile'][0] = imgBuff
        }

      }

      return res.status(200).send({
        data: petData,
        current: petData.length,
        totalCount,
        pagination: getPagination,
        message: "Pet data successfully received",
      });
    }
    return res.status(200).send({
      data: [],
      message: "No Record found",
    });
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: "Something went wrong" });
  }

};

const getPetDetail = async (req, res) => {
  try {

    let pet = (await Pet.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.id),
          isDeleted: false
        }
      }, {
        $lookup: {
          from: "users",
          let: { uploadedBy: "$uploadedBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$$uploadedBy", "$_id"]
                    },
                    {
                      $eq: [false, "$isDeleted"]
                    }
                  ]
                }
              }
            }
          ],
          as: "userInfo"
        }
      },
      {
        $unwind: "$userInfo"
      },
      {
        $project: {
          userName: '$userInfo.userName',
          userEmail: '$userInfo.email',
          userPhone: '$userInfo.phone',
          userProfile: '$userInfo.profileImage',
          petName: 1,
          petCategory: 1,
          petBreeds: 1,
          age: 1,
          gender: 1,
          dob: 1,
          location: 1,
          petProfile: 1,
          address: 1,
          aboutPets: 1
        }
      }
    ]))[0]
    if (pet) {
      if (pet?.petProfile && pet?.petProfile?.length) {
        for (let i = 0; i < pet.petProfile.length; i++) {
          const imgBuffer = await getImage(pet.petProfile[i])
          if (imgBuffer === 'error') {
            return res.status(404).send({ message: 'Profile not found' })
          }
          pet['petProfile'][i] = imgBuffer
        }
      }
      return res.status(200).send({
        data: pet,
        message: 'pet detail received successfully'
      })
    } else {
      return res.status(400).send({ message: 'Pet Detail not found' })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).send({ message: 'Something went wrong' })
  }
}

const editPet = async (req, res) => {
  try {

    if (req?.fileValidationError) {
      return res.status(400).send({
        status: 400,
        message: req.fileValidationError,
      });
    }

    let obj = {
      petName: req?.body?.petName.trim(),
      petCategory: req?.body?.petCategory ? req?.body?.petCategory.toLowerCase().trim() : req?.body?.petCategory,
      gender: (req?.body?.gender).toLowerCase(),
      petBreeds: req?.body?.petBreads ? req?.body?.petBreads.toLowerCase().trim() : req?.body?.petBreads,
      dob: moment(new Date(req?.body?.dob)).format("YYYY-MM-DD[T00:00:00.000Z]"),
      location: req?.body?.location,
      address: req?.body?.address,
      aboutPets: req?.body?.aboutPets
    };

    const ageDiffInYears = moment().diff(moment(obj['dob']), 'years', true)
    if (parseInt(ageDiffInYears) <= 0) {
      const ageDiffInMonths = moment().diff(moment(obj['dob']), 'months', true)
      if (parseInt(ageDiffInMonths) <= 0) {
        const ageDiffInDays = moment().diff(moment(obj['dob']), 'days', true)
        if (parseInt(ageDiffInDays) <= 0) {
          obj['age'] = "1"
        } else {
          if (!Number.isInteger(ageDiffInDays)) {
            obj['age'] = String(`${(Math.trunc(ageDiffInDays))}+ days`)
          } else {
            obj['age'] = String(`${Math.trunc(ageDiffInDays)} days`)
          }
        }
      } else {
        if (!Number.isInteger(ageDiffInMonths)) {
          obj['age'] = String(`${(Math.trunc(ageDiffInMonths))}+ months`)
        } else {
          obj['age'] = String(`${Math.trunc(ageDiffInMonths)} months`)
        }
      }

    } else {
      if (!Number.isInteger(ageDiffInYears)) {
        obj['age'] = String(`${(Math.trunc(ageDiffInYears))}+ years`)
      } else {
        obj['age'] = String(`${Math.trunc(ageDiffInYears)} years`)
      }
    }

    if (req.files && req?.files?.length) {
      let fileArray = []
      for (let data of req.files) {
        fileArray.push(`pets/${(data.filename).trim()}`)
      }
      obj["petProfile"] = fileArray;
    }

    Pet.updateOne({ _id: req.params.id, isDeleted: false }, { $set: obj }).then();
    return res
      .status(201)
      .send({ status: 201, message: "Pet updated successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

module.exports = { registerPet, getPetList, getPetDetail, editPet };
