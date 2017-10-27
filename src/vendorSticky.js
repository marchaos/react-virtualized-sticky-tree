export default () => {
    if (/Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)) {
        return '-webkit-sticky';
    }

   return 'sticky';
}