export class PushNeedsInstallError extends Error { constructor() { super('pushPage.needsInstall'); } }
export class PushNotSupportedError extends Error { constructor() { super('pushPage.notSupported'); } }
export class PushDeniedError extends Error { constructor() { super('pushPage.denied'); } }
export class PushUnavailableError extends Error { constructor() { super('pushPage.unavailable'); } }
