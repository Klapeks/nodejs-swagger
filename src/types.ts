export interface SwaggerInfo {
    info: {
        title: string,
        description?: string,
        version?: string
    },
    host?: string,
    basePath?: string,
    schemes?: string[],
    definitions?: never
}

export interface SwaggerPath {
    tags: string[],
    summary: string,
    description: string,
    parameters: any[],
    responses: any,
}

export type SwaggerFile = SwaggerInfo & {
    paths: { [path: string]: {
        [method: string]: SwaggerPath
    }}
}

export interface SwaggerPathInfo {
    path: string,
    method: string,
    data: SwaggerPath
}