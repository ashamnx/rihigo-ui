import type {SpeakConfig} from 'qwik-speak';

export const config: SpeakConfig = {
    defaultLocale: {lang: 'en-US', currency: 'USD', timeZone: 'America/Los_Angeles'},
    supportedLocales: [
        {lang: 'en-US', currency: 'USD', timeZone: 'America/Los_Angeles'},
        {lang: 'it-IT', currency: 'EUR', timeZone: 'Europe/Rome'},
    ],
    assets: [
        'app',
        'auth',
        'home',
        'profile'
    ],
    runtimeAssets: [
        'runtime'
    ]
};
