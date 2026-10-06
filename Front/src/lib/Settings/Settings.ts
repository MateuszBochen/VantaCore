import mainConfig from '../../main.config.json';
import {SettingName} from './Enum/SettingName';

// Optional per-environment override, deliberately not tracked in git - Rollup's commonjs plugin
// statically resolves this at build time when the file exists (bundling it in), and throws (caught
// below, falling back to mainConfig alone) when it doesn't. Not a real Node global - `require` isn't
// available in the browser - hence the local ambient declaration instead of pulling in @types/node.
declare const require: (path: string) => Record<string, string>;

export class Settings {
    private static instance: Settings;
    private readonly data: {[key: string]: string};

    private constructor() {
        let localConfig;
        try {
            localConfig = require('../../local.config.json');
        } catch {
            // local.config.json is an optional per-environment override - not
            // present in most checkouts, and its absence is the normal case.
        }

        this.data = {...mainConfig, ...localConfig};
    }

    static getSetting(name:SettingName): string {
        if (!Settings.instance) {
            Settings.instance = new Settings();
        }

        return Settings.instance.getSettingName(name);
    }

    getSettingName(name:SettingName): string {
        if (name in this.data) {
            return this.data[name];
        }

        return '';
    }
}
