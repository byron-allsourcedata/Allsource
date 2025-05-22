
(function() {
    let cartEventCalled = false;
    let productViewedEventCalled = false;
    let productData = null;
    const productUrl = location.protocol + '//' + location.host + location.pathname.replace(/\/$/, '');

    if (productUrl.includes("/products/")) {
        fetch(productUrl + '.js')
            .then(res => res.json())
            .then(data => {
                productData = data;
            });
    }

    function getProductData(item) {
        let itemAdded = null;
        const defaultImageUrl = getImageUrl();

        if (item) {
            if (item.items && Array.isArray(item.items)) {
                item = item.items[0];
            }
            productData = item;
        }

        if (productData) {
            itemAdded = {
                name: productData.title,
                product_id: productData.id,
                product_url: productUrl,
                price: productData.price,
                image_url: getImageUrl() || defaultImageUrl,
                currency: window.Shopify?.currency?.active
            };

            if (productData.variant_id) {
                itemAdded.product_id = productData.product_id || itemAdded.product_id;
                itemAdded.VariantID = productData.variant_id;
                itemAdded.Variant = productData.title || productData.variant_title;
            } else {
                const variantId = new URLSearchParams(window.location.search).get('variant');
                if (variantId) {
                    const variant = productData.variants?.find(v => v.id.toString() === variantId);
                    if (variant) {
                        itemAdded.price = variant.price;
                        itemAdded.VariantID = variant.id;
                        itemAdded.Variant = variant.name;
                    }
                }
            }
        }

        return itemAdded;
    }

    function getImageUrl() {
        if (productData) {
            if (typeof productData.featured_image === 'string') {
                return productData.featured_image;
            } else if (typeof productData.featured_image === 'object') {
                return productData.featured_image.url;
            }
            const variantId = new URLSearchParams(window.location.search).get('variant');
            if (variantId) {
                const variant = productData.variants?.find(v => v.id.toString() === variantId);
                return variant?.featured_image?.src || null;
            }
        }
        return null;
    }

    addedToCartHandler = function(item) {
        if (!cartEventCalled && productData) {
            const itemAdded = getProductData(item);
            if (itemAdded && typeof addToCart === 'function') {
                addToCart(itemAdded);
                cartEventCalled = true;
            }
        }
    };

    viewedProductHandler = function() {
        if (productData && !productViewedEventCalled) {
            const itemAdded = getProductData();
            if (itemAdded && typeof viewedProduct === 'function') {
                viewedProduct(itemAdded);
                productViewedEventCalled = true;
            }
        }
    };

    setTimeout(viewedProductHandler, 6000);
})();

(function(ns, fetch) {
    ns.fetch = function() {
        const response = fetch.apply(this, arguments);
        response.then(async (res) => {
            const clonedResponse = res.clone();
            if (clonedResponse.ok && clonedResponse.url && (window.location.origin + '/cart/add.js').includes(clonedResponse.url)) {
                if (!location.pathname.includes("/cart")) {
                    try {
                        const data = await clonedResponse.json();
                        if (data) {
                            addedToCartHandler(data);
                        }
                    } catch (error) {}
                }
            }
        });

        return response;
    };
}(window, window.fetch));

!function () {
    function trackCheckout() {
        if (typeof Shopify === 'undefined') {
            return;
        }

        if (typeof Shopify.checkout === 'undefined') {
            return;
        }

        var event = Shopify.checkout;
        var totalPrice = event.total_price;
        if (typeof totalPrice !== 'undefined') {
            if (!totalPrice.toString().includes('.')) {
                totalPrice = (totalPrice / 100).toFixed(2);
            }
        } else {
            return;
        }

        var order_data = {
            order_id: event.order_id,
            total_price: totalPrice,
            currency: event.currency,
            created_at_shopify: event.created_at    
        };

        if (typeof checkoutCompleted === 'function') {
            checkoutCompleted(order_data);
        }
    }

    function checkForCheckout() {
        if (typeof Shopify !== 'undefined' && typeof Shopify.checkout !== 'undefined') {
            clearInterval(checkInterval);
            trackCheckout();
        }
    }

    var checkInterval = setInterval(checkForCheckout, 1000);
    setTimeout(function() {
        clearInterval(checkInterval);
    }, 30000);
}();


function addToCart(item) { PixelSendFunction({action: 'product_added_to_cart', product: item}) }

function viewedProduct(item) { PixelSendFunction({action: 'viewed_product', product: item}) }

function checkoutCompleted(detail) { PixelSendFunction({action: 'checkout_completed', order_detail: detail })}

function sendPixelClientId(clientId, apiUrl) {
    if (!apiUrl) return Promise.resolve(null);

    return fetch(`${apiUrl}/external_api/install-pixel/check-pixel-installed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pixelClientId: clientId, url: window.location.href })
    })
    .then(response => response.ok ? response.json() : null)
    .catch(error => {
        console.error('Pixel check error:', error);
        return null;
    });
}

function createPopup({ success, message }) {
    const popup = document.createElement("div");
    popup.className = "popup";

    const icon = success
        ? `<img src="https://jsstore.s3-us-west-2.amazonaws.com/circle-check.png" style="width:18px;">`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="red" stroke-width="2" stroke-linecap="round"/>
           </svg>`;

    popup.innerHTML = `
        <div style="text-align:center; padding-bottom:24px;">
            <img src="https://allsourcedev.io/logo.svg" style="height:36px; width:auto;">
        </div>
        <table style="width:100%; font-size:14px; border-collapse:collapse; margin:0;">
            <tr>
                <th style="border-bottom:1px solid #000; border-right:1px solid #000; padding-bottom:6px; width:50%; text-align:left;">SCRIPT</th>
                <th style="border-bottom:1px solid #000; padding-bottom:6px; text-align:center;">FOUND</th>
            </tr>
            <tr>
                <td style="border-right:1px solid #000; color:#1F2C48; height:32px; text-align:left; padding:4px; background:#fff;">Setup Pixel</td>
                <td style="text-align:center; padding:4px; background:#fff;">${icon}</td>
            </tr>
        </table>
        ${!success ? `<div style="color: #d00; margin-top: 16px; font-size: 14px; text-align: center;">${message}</div>` : ""}
    `;

    Object.assign(popup.style, {
        position: "fixed",
        top: "1rem",
        right: "1rem",
        backgroundColor: "#fff",
        color: "#4d505a",
        borderRadius: "8px",
        font: "600 16px Arial, sans-serif",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        border: "1px solid #ccc",
        width: "400px",
        zIndex: "9999",
        padding: "1rem",
        cursor: "pointer"
    });

    popup.addEventListener("click", () => popup.remove());
    document.body.appendChild(popup);
}

function PixelSendFunction(params) {
    if (!window.pixelClientId) {
        return;
    }
    const pixelPuid = {
        client_id: window.pixelClientId,
        purpose: 'website',
        current_page: window.location.href,
        ...params
    };

    const pixelUrl = `https://a.usbrowserspeed.com/cs?pid=aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7&puid=${encodeURIComponent(JSON.stringify(pixelPuid))}`;
    const pixelScript = document.createElement('script');
    pixelScript.src = pixelUrl;
    document.body.appendChild(pixelScript);

    const urlParams = new URLSearchParams(window.location.search);
    const apiUrl = urlParams.get('api');
    const checkPixel = urlParams.get("mff");
    if (!checkPixel || !apiUrl || checkPixel !== "true") return;

    sendPixelClientId(window.pixelClientId, apiUrl).then(res => {
        if (!res) return;
        const popupOptions = {
            success: res.status === 'PIXEL_CODE_INSTALLED',
            message: {
                'PIXEL_MISMATCH': 'You installed a pixel from another domain!',
                'INCORRECT_PROVIDER_ID': 'Provider id not found'
            }[res.status] || ''
        };
        createPopup(popupOptions);
    });
}

PixelSendFunction();