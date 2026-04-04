const params = new URLSearchParams(window.location.search)
export const DEV_MODE = params.get('dev') === 'true'
