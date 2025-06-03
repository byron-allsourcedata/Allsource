(function() {
    let cartEventCalled = false;
    let productViewedEventCalled = false;

    function isProductPage() {{
        return document.querySelector('.productView') !== null; 
    }}

    addedToCartHandler = function(item) {
    if (!cartEventCalled) {
        if (typeof addToCart === 'function') {
            addToCart(item);
            cartEventCalled = true;
        }
    }
};

    viewedProductHandler = function() {{
        if (isProductPage() && !productViewedEventCalled) {{
            if (typeof viewedProduct === 'function') {{
                viewedProduct();
                productViewedEventCalled = true; 
            }}
        }}
    }};

    setTimeout(viewedProductHandler, 6000);
})();

(function(ns, fetch) {{
    ns.fetch = function() {{
        const response = fetch.apply(this, arguments);
        response.then(async (res) => {{
            const clonedResponse = res.clone();  
            if (clonedResponse.ok && clonedResponse.url && clonedResponse.url.includes(window.location.origin + '/remote/v1/cart/add')) {{
                if (!location.pathname.includes("/cart")) {{
                    try {{
                        const data = await clonedResponse.json();
                        if (data) {{
                            addedToCartHandler(data);  
                        }}
                    }} catch (error) {{
                        console.error('Ошибка:', error);
                    }}
                }}
            }}
        }});
        return response; 
    }};
}})(window, window.fetch);

(function() {
    let checkoutCompletedCalled = false;

    function getCartPriceValue() {
        const priceItemElement = document.querySelector('.cart-priceItem-value');
        if (priceItemElement) {
            const priceValue = priceItemElement.textContent.trim();
            const numericValue = parseFloat(priceValue.replace(/[^0-9.-]+/g, ""));
            return numericValue; 
        }
        return null; 
    }

    function checkoutHandler() {
        if (!checkoutCompletedCalled) {
            const totalPrice = getCartPriceValue(); 
            if (totalPrice !== null) {
                checkoutCompleted({ total_price: totalPrice });
                checkoutCompletedCalled = true; 
            }
        }
    }

    setTimeout(checkoutHandler, 2000);
})();




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

function createPopup({ success, message, domain_url }) {
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
        ${domain_url ? `
            <div style="text-align:right; margin-top:30px;">
                <a href="${domain_url}" style="background-color:#002868; color:#fff; text-decoration:none; padding:8px 16px; font-size:14px; border-radius:4px; display:inline-block; min-height:25px; line-height:25px;">
                    Go back
                </a>
            </div>
        ` : ""}
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
    const domain_url = new URLSearchParams(window.location.search).get('domain_url');
    if (!checkPixel || !apiUrl || checkPixel !== "true") return;

    sendPixelClientId(window.pixelClientId, apiUrl).then(res => {
        if (!res) return;
        const popupOptions = {
            success: res.status === 'PIXEL_CODE_INSTALLED',
            message: {
                'PIXEL_MISMATCH': 'You installed a pixel from another domain!',
                'INCORRECT_PROVIDER_ID': 'Provider id not found'
            }[res.status] || '',
            domain_url: domain_url
        };
        createPopup(popupOptions);
    });
}

PixelSendFunction();