import { createValidator } from 'express-joi-validation'
import * as Joi from '@hapi/joi'

import fs from 'fs'
import { ERRORS, getErrorMessage } from '../responses'
import File from '../../models/File'



export const validator = createValidator({ passError: true })

export const multipartValidator = (schema) => (req, res, next) => {
    let data = {}
    try {
        const files = {}
        const fields = { ...req.fields, ...req.complementary_fields }
        delete fields.file
        Object.keys(req.files).forEach((file) => {
            files[file] = fs.readFileSync(req.files[file].path)
        })
        data = { ...files, ...fields }
    }
    catch (err) {
        /* eslint-disable no-console */
        console.error(err)
        return res.status(400).json({
            type: 'multipart',
            message: ERRORS.BAD_REQUEST
        })
    }
    try {
        Joi.assert(data, schema)
        const files = {}
        Object.keys(req.files).forEach(fileKey => {
            files[fileKey] = new File(
                fs.readFileSync(req.files[fileKey].path),
                req.files[fileKey].name.replace(/ /g, '_').replace(new RegExp(/[^0-9a-zA-Z_.]+/g), ''),
                req.files[fileKey].type,
                req.files[fileKey].path
            )
            files[fileKey].mimeType = files[fileKey].name.split('.')[files[fileKey].name.split('.').length - 1]
        })
        req.files = files
        next()
    } catch (err) {
        return res.status(400).json({
            type: 'multipart',
            message: err.details ? err.details[0].message.toString() : getErrorMessage(400)
        })
    }
}
