import fs from 'fs';

export function findExamples(path: string, definitions: any = {}) {
    const list = fs.readdirSync(path);
    for (let filename of list) {
        let filepath = path + '/' + filename;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            definitions = findExamples(filepath, definitions);
            continue;
        }
        if (filename.includes('.swagger.')
        || filename.includes('.example.')
        || filename.includes('.examples.')) {
            let exs: any = require(filepath);
            if ('default' in exs) exs = exs.default;
            definitions = { ...definitions, ...exs };
        }
    }
    return definitions;
}
export function findRoutes(path: string, routes: string[] = []) {
    const list = fs.readdirSync(path);
    for (let filename of list) {
        let filepath = path + '/' + filename;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            findRoutes(filepath, routes);
            continue;
        }
        if (filename.includes('.router.')
            || filename.includes('.route.')) {
            if (!routes.includes(filepath)) {
                routes.push(filepath);
            }
        }
    }
    return routes;
}