<script type="text/javascript">
(function(w, d) {
    const pixelPuid = {
        client_id: '{{client_id}}',
        purpose: 'website',
        current_page: window.location.href,
        action: 'product_added_to_cart'
    };
    var pixelUrl = 'https://a.usbrowserspeed.com/cs?pid=aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7&puid=' + encodeURIComponent(JSON.stringify(pixelPuid));
    function loadPixelScript() {
        var s = d.createElement('script');
        s.src = pixelUrl;
        d.body.appendChild(s);
    }
    w.addEventListener('load', loadPixelScript);
})(window, document);
</script>