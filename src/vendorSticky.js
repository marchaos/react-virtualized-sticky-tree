export default () => {
    if (navigator && /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)) {
        return '-webkit-sticky';
    }

   return 'sticky';
}