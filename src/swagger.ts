import { Router } from "express";
import swaggerAutogen from 'swagger-autogen';
import swaggerUi from 'swagger-ui-express';
import { findExamples, findRoutes } from "./finder";
import { SwaggerFile, SwaggerInfo, SwaggerPathInfo } from "./types";

export default class Swagger {
    readonly doc: SwaggerInfo;
    outputFile: string = 'swagger.json';
    searchFolder: string;
    
    constructor(doc: SwaggerInfo, searchFolder: string) {
        this.searchFolder = searchFolder;
        if (!doc.host) doc.host = '';
        if (!('basePath' in doc)) {
            doc.basePath = '/api';
        }
        if (!('definitions' in doc)) {
            doc.definitions = {} as any;
        }
        this.doc = doc;
    }

    private _generatedData: SwaggerFile | undefined = undefined;
    async generate(): Promise<SwaggerFile> {
        const definitions = findExamples(this.searchFolder);
        const routes = findRoutes(this.searchFolder);
        this.doc.definitions = definitions;

        const result = await swaggerAutogen()(this.outputFile, routes, this.doc);
        if (!result || !result.data) throw "????";
        return this._generatedData = result.data as SwaggerFile;
    }

    changeData(...callbacks: ((paths: SwaggerPathInfo[]) => SwaggerPathInfo[])[]) {
        if (!this._generatedData) throw "Not generated yet";
        // Convert path object to an array
        let paths = [] as SwaggerPathInfo[];
        Object.entries(this._generatedData.paths)
        .forEach(([path, methods]) => {
            Object.entries(methods).forEach(([method, data]) => {
                paths.push({ path, method, data});
            });
        });
        // change from outside
        for (let cb of callbacks) {
            if (cb) paths = cb(paths);
        }
        // Convert back to path object
        const np = {} as SwaggerFile['paths'];
        paths.forEach(data => {
            if (!np[data.path]) np[data.path] = {};
            np[data.path][data.method] = data.data;
        });
        return this._generatedData.paths = np;
    }

    attach(router: Router) {
        if (!this._generatedData) throw "Not generated yet";
        router.use(swaggerUi.serve, swaggerUi.setup(this._generatedData));
    }

    
    // Static fileds

    static filterByTag(tag: string) {
        return (paths: SwaggerPathInfo[]) => {
            return paths.filter(p => {
                if (!p.data.tags) return false;
                let save = false;
                p.data.tags = p.data.tags.filter(t => {
                    if (t.toLowerCase() == tag) {
                        save = true; return false;
                    }
                    return true;
                });
                return save;
            });
        }
    }
    static sortByTags(sortingTags: string[]) {
        function getTag(data: SwaggerPathInfo) {
            return data?.data?.tags?.[0];
        }
        function getTagIndex(tag: string | SwaggerPathInfo): number {
            if (typeof tag == 'object') tag = getTag(tag);
            if (!tag) return 998;
            tag = tag.toLowerCase();
            if (tag.startsWith("other")) return 999;
            const i = sortingTags.indexOf(tag);
            return i >= 0 ? i : 998;
        }

        return (paths: SwaggerPathInfo[]) => {
            return paths.sort((a,b) => {
                return getTagIndex(a) - getTagIndex(b);
            });
        }
    }

}