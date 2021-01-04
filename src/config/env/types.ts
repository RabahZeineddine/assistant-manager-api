

export type EnvType = {
    PORT: number
    NODE_ENV: string
    ASSISTANT: {
        V1: {
            APIKEY: string
            URL: string
            VERSION: string
            WORKSPACES: {
                SKILL_ID: string
            }
        }
    }
}