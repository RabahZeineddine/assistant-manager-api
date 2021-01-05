
import excelToJson from 'convert-excel-to-json'
import AssistantV1 from 'ibm-watson/assistant/v1'
import CustomAssistantV1 from '../../config/assistant/v1'
import { env } from '../../config/index'
import json2xls from 'json2xls'
import File from '../../models/File'
import Joi from '@hapi/joi'
import { xslxCredentialsSchemas } from './schemas'
import { Helper } from '../../utils/Helper'

export class AssistantController {

    private assistantV1: AssistantV1 | any

    constructor() {
        this.assistantV1 = null
    }


    async testSkill(file: File) {
        const result = this.getDataFromExcel(file)
        const credentials = await this.getCredentials(result)
        this.assistantV1 = CustomAssistantV1(credentials.ASSISTANT)
        const dialog: Array<any> = this.parseExcelJson(result)

        if (dialog.length == 0) throw new Error('Empty or invalid file')

        const finalResult: any = []
        for (let i = 0; i < dialog.length; i++) {
            const interaction = dialog[i]

            let inputContext: any = interaction.context || {}
            if (interaction.parentId) {
                const parentInteraction = dialog.find((item) => item.id == interaction.parentId)
                if (parentInteraction && parentInteraction.outputContext) {
                    inputContext = { ...parentInteraction.outputContext, ...inputContext }
                }
            }
            const assistantResult = await this.messageV1(
                { text: interaction.input },
                inputContext,
                credentials.ASSISTANT.SKILL_ID
            )

            interaction.status = ''
            if (assistantResult.status != 200) interaction.error = assistantResult.result
            const assistantOutputs = assistantResult.result?.output?.text
            if (assistantOutputs) {
                let valid = false
                let validOutputsCount = 0
                assistantOutputs.forEach((output: string, innerIndex: number) => {
                    if (interaction.output?.[innerIndex]?.indexOf(output.trim()) != -1
                        && assistantOutputs.length == interaction.output.length) validOutputsCount++
                })
                if (validOutputsCount == assistantOutputs.length) valid = true

                interaction.status = valid ? 'aprovado' : 'reprovado'
                interaction.currentOutput = assistantOutputs
                interaction.outputContext = assistantResult.result.context
            } else {
                // Não deu certo o output
            }

            finalResult.push(interaction)
        }
        const output = await this.writeOutputToExcel(finalResult)
        return output
    }

    private getDataFromExcel(file: File) {
        const result = excelToJson({
            source: file.getBuffer(),
            columnToKey: {
                '*': '{{columnHeader}}',
            },
            header: {
                rows: 1
            },
            sheetStubs: true
        })
        return result
    }

    private async getCredentials(data: any) {
        const credentials = data?.credentials?.[0]
        const parsedCredentials = {
            ASSISTANT: {
                APIKEY: credentials['assistant-apiKey'],
                VERSION: credentials['assistant-version'],
                URL: credentials['assistant-url'],
                SKILL_ID: credentials['assistant-skillID']
            }
        }
        try {
            Joi.assert(parsedCredentials, xslxCredentialsSchemas)
            parsedCredentials.ASSISTANT.VERSION = new Date(parsedCredentials.ASSISTANT.VERSION).toISOString().split('T')[0]
        } catch (error) {
            throw { isJoi: true, type: 'body', error }
        }
        return parsedCredentials
    }

    private parseExcelJson(data: any): Array<any> {
        const result: Array<any> = []

        let interaction: any = {}
        data?.dialog.forEach((line: any) => {
            if (line['disabled'] != 'TRUE') {
                if (line.id && line.input) {
                    if (Object.keys(interaction).length > 0) result.push(Helper.clone(interaction))
                    interaction = {
                        id: line.id,
                        parentId: line['parent-id'],
                        input: line.input?.trim()
                    }
                }

                if (line.output) {
                    if (!interaction.output) interaction.output = []
                    const outputIndex: number = interaction.output.length
                    if (!interaction.output[outputIndex]) interaction.output[outputIndex] = []
                    interaction.output[outputIndex].push(line.output.trim())
                }

                if (line['output-variation']) {
                    if (interaction.output && interaction.output.length > 0) interaction.output[interaction.output.length - 1].push(line['output-variation'].trim())
                }
                if (line.context) {
                    try {
                        const context = JSON.parse(line.context)
                        interaction.context = context
                    } catch (error) {
                        console.error(error)
                    }
                }

            }
        })

        if (Object.keys(interaction).length > 0 && result[result.length - 1] != interaction) result.push(Helper.clone(interaction))
        return result
    }

    async messageV1(input: any, context: any = {}, workspaceId: string) {
        try {
            const response = await this.assistantV1.message({
                workspaceId: workspaceId || env.ASSISTANT.V1.WORKSPACES.SKILL_ID,
                input,
                context
            })
            return response
        } catch (error) {
            console.error(error)
            throw error
        }
    }

    async writeOutputToExcel(result: Array<any>) {
        result = result.reduce((acc: Array<any>, curr: any) => {
            const rows: Array<any> = []
            const firstRow: any = Helper.clone(curr)
            delete firstRow.output
            delete firstRow.currentOutput
            delete firstRow.outputContext
            rows.push(firstRow)
            let currentRow = 0
            let currentOutputIndex = 0
            curr.output.forEach((items: Array<any>) => {
                items.forEach((item: any, index: number) => {
                    while (currentRow > rows.length - 1) rows.push({})
                    if (index == 0) {
                        rows[currentRow].output = item
                        rows[currentRow].currentOutput = curr.currentOutput[currentOutputIndex]
                        currentOutputIndex++
                    }
                    else if (index >= 1) {
                        rows[currentRow].variation = item
                        currentRow++
                    }
                })
                if (items.length == 1 && curr.output.length > 1) currentRow++
            })

            while (currentOutputIndex < curr.currentOutput.length) {
                while (currentRow > rows.length - 1) rows.push({})
                rows[currentRow].currentOutput = curr.currentOutput[currentOutputIndex]
                currentOutputIndex++
                currentRow++
            }
            acc = acc.concat(rows)
            return acc
        }, [])

        const xlsx = json2xls(result.map((row) => ({
            id: row.id,
            parentId: row.parentId,
            input: row.input,
            output: row.output,
            variation: row.variation,
            currentOutput: row.currentOutput,
            status: row.status,
            ...row
        })))
        return xlsx
    }
}