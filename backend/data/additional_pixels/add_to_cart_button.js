<script type="text/javascript">
document.querySelector(".product-block_price button.btn-primary").onclick = function ProductAddedToCartFunction() {
    const pixelPuid = {
        client_id: '{{client_id}}',
        purpose: 'website',
        current_page: window.location.href,
        action: 'product_added_to_cart'
    };
    const pixelUrl = `https://a.usbrowserspeed.com/cs?pid=aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7&puid=${encodeURIComponent(JSON.stringify(pixelPuid))}`;
    const pixelScript = document.createElement('script');
    pixelScript.src = pixelUrl;
    document.body.appendChild(pixelScript);
};
</script>