import { register } from "@shopify/web-pixels-extension";

register(async ({ analytics, browser, settings, init }) => {

    analytics.subscribe('product_added_to_cart', (event) => {
        const cartInfo = event.data.cartLine;
        const payload = {
            origin: init.context.document.location.hostname,
            platform: 'shopify',
            quantity: cartInfo.quantity,
            amount: cartInfo.cost.totalAmount.amount,
            currency: cartInfo.cost.totalAmount.currency,
            product_id: cartInfo.merchandise.product.id,
            product_title: cartInfo.merchandise.product.title,
            product_url: cartInfo.merchandise.product.url,
            sku: cartInfo.merchandise.sku
        };
        PixelSendFunction({ action: 'product_added_to_cart', product: payload });
    });

    analytics.subscribe('product_viewed', (event) => {
        const productInfo = event.data.productVariant;
        const payload = {
            origin: init.context.document.location.hostname,
            platform: 'shopify',
            product_id: productInfo.product.id,
            product_title: productInfo.product.title,
            product_sku: productInfo.product.sku
        };
        PixelSendFunction({ action: 'viewed_product', product: payload });
    });

    analytics.subscribe('checkout_completed', (event) => {
        const orderInfo = event.data.checkout;
        const payload = {
            origin: init.context.document.location.hostname,
            platform: 'shopify',
            order_id: orderInfo.order.id,
            currency: orderInfo.totalPrice.currencyCode,
            order_amount: orderInfo.totalPrice.amount,
            customer_id: orderInfo.order.customer.id,
            first_name: orderInfo.billingAddress.firstName,
            last_name: orderInfo.billingAddress.lastName,
            email: orderInfo.email,
            phone: orderInfo.phone,
            is_complete: true,
            status: "COMPLETED",
            country_code: orderInfo.billingAddress.countryCode,
            city: orderInfo.billingAddress.city,
            postal_code: orderInfo.billingAddress.zip
        };
        PixelSendFunction({ action: 'checkout_completed', order_detail: payload });
    });

    function showPopup() {
        const popup = document.createElement("div");
        popup.className = "popup";
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
            zIndex: "999",
            padding: "1rem",
        });

        popup.innerHTML = `
            <div style="text-align:center; padding-bottom:24px;">
              <img src="https://dev.maximiz.ai/logo.svg" style="height:36px; width:auto;">
            </div>
            <table style="width:100%; font-size:14px; border-collapse:collapse; margin:0;">
              <tr>
                <th style="border-bottom:1px solid #000; border-right:1px solid #000; padding-bottom:6px; width:50%; text-align:left;">SCRIPT</th>
                <th style="border-bottom:1px solid #000; border-right:1px solid #000; padding-bottom:6px; text-align:center;">FOUND</th>
              </tr>
              <tr>
                <td style="border-right:1px solid #000; color:#1F2C48; height:32px; text-align:left; padding:4px; background:#fff;">Setup Pixel</td>
                <td style="border-right:1px solid #000; text-align:center; padding:4px; background:#fff;">
                  <img src="https://jsstore.s3-us-west-2.amazonaws.com/circle-check.png" style="width:18px;">
                </td>
              </tr>
            </table>
            <div style="padding-top:20px; color:#1F2C48;"></div>
        `;

        document.body.appendChild(popup);
        popup.addEventListener("click", () => popup.remove());
    }

    function PixelSendFunction(params) {
        if (!settings.accountID) {
            return;
        }
        const apiUrl = new URLSearchParams(location?.search).get('api');
        const vge = new URLSearchParams(location?.search).get('vge');
        if (apiUrl && vge) {
            showPopup();
            fetch(`${apiUrl}/external_api/install-pixel/check-pixel-installed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pixelClientId: settings.accountID, url: location?.href })
            })
            .then(response => {
                if (!response.ok) {
                    console.error('Failed to validate pixel installation:', response);
                    return;
                }
                return response.json();
            })
            .then(data => {
                console.log('Pixel validation successful:', data);
            })
            .catch((error) => {
                console.error('Error validating pixel installation:', error);
            });
        }

        const pixelPuid = {
            client_id: settings.accountID,
            purpose: 'website',
            current_page: location?.href,
            ...params
        };

        const pixelUrl = `https://a.usbrowserspeed.com/cs?pid=aeefb163f3395a3d1bafbbcbf8260a30b1f89ffdb0c329565b5a412ee79f00a7&puid=${encodeURIComponent(JSON.stringify(pixelPuid))}`;
        const pixelScript = document.createElement('script');
        pixelScript.src = pixelUrl;
        document.body.appendChild(pixelScript);
    }

    PixelSendFunction();
});