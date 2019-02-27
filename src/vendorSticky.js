export default () => {
    if (
        typeof navigator !== 'undefined'
        && /Safari/.test(navigator.userAgent)
        && /Apple Computer/.test(navigator.vendor)
    ) {
        return '-webkit-sticky';
    }

   return 'sticky';
}