import Joi from '@hapi/joi'

export const xslxCredentialsSchemas = Joi.object({
    ASSISTANT: Joi.object({
        APIKEY: Joi.string().required(),
        VERSION: Joi.date().required(),
        SKILL_ID: Joi.string().required(),
        URL: Joi.string().uri().required()
    })
})