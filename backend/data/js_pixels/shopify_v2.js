(function () {
    const pixelId = window.pixelClientId;
    if (!pixelId) return;

    const script_popup = document.createElement('script');
    script_popup.id = 'script_popup';
    script_popup.src = 'https://datatagmanager.s3.us-east-2.amazonaws.com/pixel_popup.js';
    script_popup.async = true;
    
    script_popup.onerror = function() {
        console.warn('Failed to load pixel_popup.js');
    };
    
    document.body.appendChild(script_popup);

    const eventQueue = [];
    let isSDKReady = false;

    function sendEvent(eventType, eventData) {
        const payload = {
            event_type: eventType,
            event_data: {
                url: window.location.href,
                timestamp: new Date().toISOString(),
                custom_data: {
                    ...eventData,
                    pixelPuid: pixelId,
                },
            },
        };

        if (isSDKReady && window.PixelSDK?.sendData) {
            window.PixelSDK.sendData(payload);
        } else {
            eventQueue.push(payload);
        }
    }

    const script = document.createElement('script');
    script.id = 'delivr-ai';
    script.src = `https://cdn.pixel.datatagmanager.com/pixels/${pixelId}/p.js`;
    script.async = true;
    
    script.onload = () => {
        const checkInterval = setInterval(() => {
            if (window.PixelSDK && window.PixelSDK.sendData) {
                clearInterval(checkInterval);
                isSDKReady = true;
                
                while (eventQueue.length > 0) {
                    const queuedPayload = eventQueue.shift();
                    window.PixelSDK.sendData(queuedPayload);
                }
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    };
    
    script.onerror = (err) => {
        console.error('Failed to load PixelSDK:', err);
    };
    
    document.body.appendChild(script);

    let cartEventCalled = false;
    let productViewedEventCalled = false;
    let productData = null;
    
    const productUrl = location.protocol + '//' + location.host + location.pathname.replace(/\/$/, '');

    if (productUrl.includes("/products/")) {
        fetch(productUrl + '.js')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                productData = data;
            })
            .catch(err => {
                console.debug('Failed to load product data:', err);
            });
    }

    function getProductData(item = null) {
        if (!productData) return null;
        
        let currentProductData = productData;
        
        if (item) {
            if (item.items && Array.isArray(item.items)) {
                currentProductData = item.items[0];
            } else {
                currentProductData = item;
            }
        }
        
        const productInfo = {
            name: currentProductData.title,
            product_id: currentProductData.id,
            product_url: productUrl,
            price: currentProductData.price,
            image_url: getImageUrl(currentProductData),
            currency: window.Shopify?.currency?.active
        };

        if (currentProductData.variant_id) {
            productInfo.product_id = currentProductData.product_id || productInfo.product_id;
            productInfo.VariantID = currentProductData.variant_id;
            productInfo.Variant = currentProductData.title || currentProductData.variant_title;
        } else {
            const variantId = new URLSearchParams(window.location.search).get('variant');
            if (variantId) {
                const variant = currentProductData.variants?.find(v => 
                    v.id.toString() === variantId || v.id === Number(variantId)
                );
                if (variant) {
                    productInfo.price = variant.price;
                    productInfo.VariantID = variant.id;
                    productInfo.Variant = variant.name;
                    
                    const variantImage = getImageUrl(currentProductData, variantId);
                    if (variantImage) {
                        productInfo.image_url = variantImage;
                    }
                }
            }
        }

        return productInfo;
    }

    function getImageUrl(product = productData, variantId = null) {
        if (!product) return null;
        
        // Базовое изображение продукта
        if (product.featured_image) {
            if (typeof product.featured_image === 'string') {
                return product.featured_image;
            } else if (product.featured_image.url) {
                return product.featured_image.url;
            }
        }
        
        if (variantId) {
            const variant = product.variants?.find(v => 
                v.id.toString() === variantId || v.id === Number(variantId)
            );
            return variant?.featured_image?.src || null;
        }
        
        return null;
    }

    const addedToCartHandler = function (item) {
        if (!cartEventCalled && productData) {
            const itemAdded = getProductData(item);
            if (itemAdded) {
                sendEvent('product_added_to_cart', itemAdded);
                cartEventCalled = true;
                
                setTimeout(() => {
                    cartEventCalled = false;
                }, 5000);
            }
        }
    };

    const viewedProductHandler = function () {
        if (productData && !productViewedEventCalled) {
            const itemAdded = getProductData();
            if (itemAdded) {
                sendEvent('viewed_product', itemAdded);
                productViewedEventCalled = true;
            }
        }
    };

    const checkoutCompletedHandler = function (detail) {
        if (detail) {
            sendEvent('checkout_completed', detail);
        }
    };

    if (productUrl.includes("/products/")) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(viewedProductHandler, 2000);
        });
        
        window.addEventListener('load', () => {
            if (!productViewedEventCalled) {
                setTimeout(viewedProductHandler, 1000);
            }
        });
    }

    (function (ns, originalFetch) {
        ns.fetch = function (...args) {
            const response = originalFetch.apply(this, args);
            
            response.then(async (res) => {
                if (!res.ok) return;
                
                try {
                    const clonedResponse = res.clone();
                    
                    if (clonedResponse.url?.startsWith(window.location.origin + '/cart/add.js')) {
                        if (!location.pathname.includes("/cart")) {
                            const data = await clonedResponse.json();
                            if (data) {
                                addedToCartHandler(data);
                            }
                        }
                    }
                    
                    if (clonedResponse.url?.includes('graphql?operationName=PollForReceipt')) {
                        try {
                            const data = await clonedResponse.json();
                            const receipt = data?.data?.receipt;
                            
                            if (receipt) {
                                checkoutCompletedHandler({
                                    platform_order_id: receipt.id,
                                    total_price: receipt.paymentDetails?.paymentAmount?.amount,
                                    currency: receipt.paymentDetails?.paymentAmount?.currencyCode,
                                    platform_created_at: Date.now(),
                                });
                            }
                        } catch (error) {
                            console.debug('Failed to parse checkout response');
                        }
                    }
                } catch (error) {
                }
            });
            
            return response;
        };
    })(window, window.fetch);
})();