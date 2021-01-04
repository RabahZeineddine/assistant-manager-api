import { NextFunction, Response, Router } from 'express'
import { AssistantController } from '../../controllers/assistant'
import ExpressFormidable from 'express-formidable'
import { multipartValidator } from '../../config/validator/index'
import { testSkillSchema } from './schemas'


const router = Router()

function initRouter() {

    router.route('/')
        .post(
            ExpressFormidable(),
            multipartValidator(testSkillSchema),
            testSkill
        )


    return router
}


const testSkill = async (req: any, res: Response, next: NextFunction) => {
    try {
        const assistantController = new AssistantController()
        const { file } = req.files
        const result = await assistantController.testSkill(file)
        res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx')
        res.setHeader('Content-Transfer-Encoding', 'binary')
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
        res.status(200).send(Buffer.from(result, 'binary'))
    } catch (error) {
        return next(error)
    }
}



export default initRouter()