import { config } from 'dotenv'
import { EnvType } from './types'
config()

export const NODE_ENV = process.env.NODE_ENV || 'development'

const env: EnvType = {
    PORT: parseInt(process.env.PORT as string, 10) || 3000,
    NODE_ENV,
    ASSISTANT: {
        V1: {
            APIKEY: process.env.ASSISTANT_V1_APIKEY || '',
            VERSION: process.env.ASSISTANT_V1_VERSION || '',
            URL: process.env.ASSISTANT_V1_URL || '',
            WORKSPACES: {
                SKILL_ID: process.env.ASSISTANT_V1_SKILL_ID || ''
            }
        }
    }
}

export default env