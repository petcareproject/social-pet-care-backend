const md5 = require("md5");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Pet = require("../models/petModel");
const Contact = require("../models/contactModel");
const { validationResult } = require("express-validator");
const { checkValidations } = require("../functions/checkValidation");
const { generatePassword, getImage } = require("../functions/common");
const { sendMail } = require("../functions/mailer");

//@desc Register a user
//@route POST /api/users/register
//@access public

const registerUser = async (req, res) => {
	try {
		const errors = validationResult(req);

		const checkValid = await checkValidations(errors);
		if (checkValid.type === "error") {
			return res.status(400).send({
				message: checkValid.errors.msg,
			});
		}

		const { username, email, phone, password } = req.body;

		const isEmail = await User.countDocuments({ email: email.toLowerCase().trim() });

		if (isEmail) {
			return res.status(400).send({
				message:
					"Email is already registered, please add different email address.",
			});
		}

		const data = await User.create({
			userName: username.trim(),
			email: email.toLowerCase().trim(),
			phone: phone.replace(/[- )(]/g, "").trim(),
			password: md5(password),
		});

		// Create token
		const token = jwt.sign({ user: data }, process.env.ACCESS_TOKEN_SECERT, {
			expiresIn: "5d",
		});

		//Update the user data
		User.updateOne(
			{ _id: data._id, isDeleted: false },
			{ $push: { tokens: token } }
		).then();

		return res
			.status(201)
			.send({ status: 201, token, message: "User created successfully" });
	} catch (error) {
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const forgotPassword = async (req, res) => {
	try {
		const errors = validationResult(req);

		const checkValid = await checkValidations(errors);
		if (checkValid.type === "error") {
			return res.status(400).send({
				message: checkValid.errors.msg,
			});
		}

		const user = await User.countDocuments({
			email: req.body.email,
			isDeleted: false,
		});
		if (!user) {
			return res.status(400).send({ message: "Email not found" });
		}

		const password = await generatePassword();
		User.updateOne(
			{ email: req.body.email },
			{ $set: { password: md5(password), tokens: [] } }
		).then();

		const mailVariable = {
			'%resetPassword%': password
		}

		sendMail('forgot-password', mailVariable, req.body.email);

		return res
			.status(201)
			.send({ status: 201, message: "Reset password sent successfully" });
	} catch (error) {
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const login = async (req, res) => {
	try {
		const errors = validationResult(req);

		const checkValid = await checkValidations(errors);
		if (checkValid.type === "error") {
			return res.status(400).send({
				message: checkValid.errors.msg,
			});
		}

		// Get user input
		const { email, password } = req.body;

		// Validate if user exist in our database
		const users = await User.findOne(
			{ email: email.toLowerCase().trim(), isDeleted: false },
			{ tokens: 0, createdAt: 0, updatedAt: 0 }
		).lean(true);

		if (users && users.password === md5(password)) {
			// Create token
			const token = jwt.sign({ user: users }, process.env.ACCESS_TOKEN_SECERT, {
				expiresIn: "5d",
			});

			let updatedUser = await User.findOneAndUpdate(
				{
					_id: users._id,
					isDeleted: false,
				},
				{ $push: { tokens: token } },
				{ new: true }
			);

			if (updatedUser?.profileImage) {
				const imgBuff = await getImage(updatedUser?.profileImage)
				if (imgBuff === 'error') {
					return res.status(404).send({ message: 'Profile not found' })
				}
				updatedUser['profileImage'] = imgBuff
			}

			return res.status(200).send({
				user: updatedUser,
				token: token,
				message: "Login Successfully",
			});
		}
		return res.status(400).send({ message: "Invalid Username and Password" });
	} catch (error) {
		// error response
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const test = async (req, res) => {
	try {
		if (req?.user?.profileImage) {
			const imgBuff = await getImage(req.user.profileImage)
			if (imgBuff === 'error') {
				return res.status(404).send({ message: 'Profile not found' })
			}
			req.user.profileImage = imgBuff
		}
		return res.status(200).send({
			users: req.user,
			message: `Welcome ${req.user.userName}`,
		});
	} catch (error) {
		// error response
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const updateProfile = async (req, res) => {
	try {

		if (req.body.userName === '' || req.body.phone === '' || req.body.city === '' || req.body.email === '' || req.body.aboutUs === '') {
			return res.status(400).send({ message: 'Please insert all field' })
		}
		
		const checkEmail = await User.countDocuments({ email: req?.body?.email.trim().toLowerCase(), isDeleted: false })
		
		if(req?.user?.email != req?.body?.email.trim().toLowerCase()) {
			if (checkEmail) {
				return res.status(400).send({ message: 'Email is already registered, please use different email address' })
			}
		}

		let obj = {
			userName: req?.body?.userName,
			phone: req?.body?.phone.replace(/[- )(]/g, "").trim(),
			city: req?.body?.city,
			email: req?.body?.email.trim().toLowerCase(),
			aboutUs: req?.body?.aboutUs,
		};

		if (req?.file?.filename) {
			obj["profileImage"] = `users/${(req?.file?.filename).trim()}`;
		}

		User.updateOne({ _id: req.user._id }, { $set: obj }).then();
		return res.status(200).send({
			message: `User profile successfully updated`,
		});
	} catch (error) {
		// error response
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const changePassword = async (req, res) => {
	try {
		const errors = validationResult(req);

		const checkValid = await checkValidations(errors);
		if (checkValid.type === "error") {
			return res.status(400).send({
				message: checkValid.errors.msg,
			});
		}

		const { currentPassword, newPassword, confirmPassword } = req.body;

		if (req?.user?.password != md5(currentPassword)) {
			return res.status(400).send({
				message:
					"The current password you provided does not match. Please double-check and try again",
			});
		}
		if (newPassword != confirmPassword) {
			return res.status(400).send({
				message:
					"The new password and confirm password entries must match. Please ensure they are identical",
			});
		}

		User.updateOne(
			{ _id: req.user._id },
			{ $set: { password: md5(newPassword), tokens: [] } }
		).then();

		return res.status(201).send({
			status: 201,
			message: "Your password has been successfully changed",
		});
	} catch (error) {
		APIErrorLog.error("Error while changing the user password");
		APIErrorLog.error(error);
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const logout = async (req, res) => {
	try {
		if (req.headers?.authorization) {
			// split the authenticate token
			const { 1: authToken } = req.headers.authorization.split(" ");

			// decode the token
			const decodeToken = jwt.decode(authToken);

			//update the database by removing the token
			User.updateOne(
				{ _id: decodeToken.user._id },
				{ $pull: { tokens: authToken } }
			).then();

			// send success response
			return res.status(200).send({
				message: "Logout Successfully",
			});
		}

		return res.status(400).send({
			message: "Token not found",
		});
	} catch (error) {
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const getUserPetList = async (req, res) => {
	try {
		let condition = {
			isDeleted: false,
			uploadedBy: req.user._id,
		};

		let petData = await Pet.find(condition).lean(true);

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
				message: "Pet data successfully received",
			});
		}
		return res.status(200).send({
			data: [],
			message: "No Record found",
		});
	} catch (error) {
		// error response
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const deleteUserPet = async (req, res) => {
	try {
		const pet = await Pet.countDocuments({
			_id: req.params.id,
			isDeleted: false,
		});

		if (!pet) {
			return res.status(400).send({
				message: "Pet not found",
			});
		}

		Pet.updateOne({ _id: req.params.id }, { $set: { isDeleted: true } }).then();

		return res.status(200).send({
			message: "Pet Deleted successfully",
		});
	} catch (error) {
		// error response
		return res.status(500).send({ message: "Something went wrong" });
	}
};

const contactPerson = async (req, res) => {
	try {
		const errors = validationResult(req);

		const checkValid = await checkValidations(errors);
		if (checkValid.type === "error") {
			return res.status(400).send({
				message: checkValid.errors.msg,
			});
		}

		const { contactName, email, phone, text } = req.body;

		await Contact.create({
			contactName: contactName.trim(),
			email: email.toLowerCase().trim(),
			phone: phone.replace(/[- )(]/g, "").trim(),
			text: text.trim()
		});

		const mailVariable = {
			'%fullName%': contactName.trim()
		}

		sendMail('contact-info', mailVariable, email.toLowerCase().trim());

		return res.status(201).send({ status: 201, message: "Your Request has been sent successfully" });
	} catch (error) {
		return res.status(500).send({ message: "Something went wrong" });
	}
};

module.exports = {
	registerUser,
	forgotPassword,
	login,
	test,
	logout,
	changePassword,
	updateProfile,
	getUserPetList,
	deleteUserPet,
	contactPerson
};
