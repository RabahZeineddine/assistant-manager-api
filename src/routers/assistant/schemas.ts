import Joi from '@hapi/joi'



export const testSkillSchema = Joi.object({
    file: Joi.binary().required()
})