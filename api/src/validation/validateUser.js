const Joi = require('joi');

 function validateUser (user){
    const schema = Joi.object({
      fullName: Joi.string()
      .min(3)
      .max(20)
      .required(),
      email: Joi.string()
      .min(3)
      .max(50)
      .required()
      .lowercase()
      .email(),
      password: Joi.string()
      .min(6)
      .required()
      .regex(/^[a-zA-Z0-9]{6,}$/),
      pin: Joi.string()
      .min(4)
      .max(4)
      .required()
      .regex(/^[0-9]$/)
    })
    return schema.validate(user);
}

module.exports = validateUser