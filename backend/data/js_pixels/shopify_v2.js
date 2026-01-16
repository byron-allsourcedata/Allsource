(function () {
    const pixelId = window.pixelClientId;
    if (!pixelId) return;

    const pixel_popup = document.createElement('script');
    pixel_popup.id = 'pixel_popup';
    pixel_popup.src = 'https://datatagmanager.s3.us-east-2.amazonaws.com/pixel_popup.js';
    pixel_popup.async = true;
    document.body.appendChild(pixel_popup);

    const eventQueue = [];
    let isSDKReady = false;
    let productData = null;
    let cartEventCalled = false;
    let productViewedEventCalled = false;
    let checkoutTracked = false;

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
                    window.PixelSDK.sendData(eventQueue.shift());
                }
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 5000);
    };
    
    document.body.appendChild(script);

    const isProductPage = window.location.pathname.includes("/products/");
    const isCheckoutPage = window.location.pathname.includes("/checkouts/");
    const isThankYouPage = window.location.pathname.includes("/thank_you") || 
                          window.location.pathname.includes("/orders/");

    function trackCheckoutCompletion() {
        if (!isCheckoutPage && !isThankYouPage) return;
        
        if (checkoutTracked) return;
        
        
        let orderData = null;
        
        if (window.Shopify?.checkout?.order_id) {
            orderData = {
                platform_order_id: window.Shopify.checkout.order_id,
                total_price: window.Shopify.checkout.total_price,
                currency: window.Shopify.checkout.currency,
                platform_created_at: Date.now()
            };
        }
        
        if (!orderData) {
            const orderElement = document.querySelector('[data-order-id], [data-order]');
            if (orderElement) {
                const orderId = orderElement.dataset.orderId || 
                               orderElement.dataset.order;
                if (orderId) {
                    const totalElement = document.querySelector('[data-total-price], .total-price');
                    const totalPrice = totalElement ? 
                        (totalElement.dataset.totalPrice || totalElement.textContent.replace(/[^\d.]/g, '')) : null;
                    
                    orderData = {
                        platform_order_id: orderId,
                        total_price: totalPrice,
                        currency: document.querySelector('[data-currency]')?.dataset.currency || 'USD',
                        platform_created_at: Date.now()
                    };
                }
            }
        }
        
        if (!orderData) {
            const urlMatch = window.location.pathname.match(/\/checkouts\/c\/([^\/]+)/);
            if (urlMatch) {
                const orderKey = new URLSearchParams(window.location.search).get('key');
                orderData = {
                    platform_order_id: orderKey || urlMatch[1],
                    platform_created_at: Date.now()
                };
            }
        }
        
        if (!orderData) {
            const pageText = document.body.textContent || '';
            const orderMatch = pageText.match(/Order\s+#?(\d+)/i) || 
                              pageText.match(/Order\s+ID:?\s*(\w+)/i);
            if (orderMatch) {
                orderData = {
                    platform_order_id: orderMatch[1],
                    platform_created_at: Date.now()
                };
            }
        }
        
        if (orderData?.platform_order_id) {
            sendEvent('checkout_completed', orderData);
            checkoutTracked = true;
        } else if (isThankYouPage) {
            sendEvent('checkout_completed', {
                platform_order_id: 'unknown_' + Date.now(),
                platform_created_at: Date.now()
            });
            checkoutTracked = true;
        }
    }

    trackCheckoutCompletion()
    
    if (isProductPage) {
        const productUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
        
        fetch(productUrl + '.js')
            .then(res => {
                if (!res.ok) return null;
                return res.json();
            })
            .then(data => {
                if (data) {
                    productData = data;
                    if (!productViewedEventCalled && productData) {
                        const productInfo = getProductData();
                        if (productInfo) {
                            sendEvent('viewed_product', productInfo);
                            productViewedEventCalled = true;
                        }
                    }
                }
            })
            .catch(() => {});
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
            product_url: window.location.href,
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
                    v.id.toString() === variantId
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
        
        if (product.featured_image) {
            if (typeof product.featured_image === 'string') {
                return product.featured_image;
            } else if (product.featured_image.url) {
                return product.featured_image.url;
            }
        }
        
        if (variantId) {
            const variant = product.variants?.find(v => v.id.toString() === variantId);
            return variant?.featured_image?.src || null;
        }
        
        return null;
    }

    function addedToCartHandler(item) {
        if (cartEventCalled) return;
        
        if (!productData && isProductPage) {
            const productUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
            fetch(productUrl + '.js')
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        productData = data;
                        sendCartEvent(item);
                    }
                })
                .catch(() => {});
        } else if (productData) {
            sendCartEvent(item);
        }
    }
    
    function sendCartEvent(item) {
        const productInfo = getProductData(item);
        if (productInfo) {
            sendEvent('product_added_to_cart', productInfo);
            cartEventCalled = true;
            setTimeout(() => { cartEventCalled = false; }, 5000);
        }
    }

    (function (ns, originalFetch) {
        ns.fetch = function (...args) {
            const response = originalFetch.apply(this, args);
            
            response.then(async (res) => {
                if (!res.ok) return;
                
                const clonedResponse = res.clone();
                const url = clonedResponse.url || '';
                
                if (url.includes('/cart/add') && !window.location.pathname.includes("/cart")) {
                    try {
                        const data = await clonedResponse.json();
                        if (data) addedToCartHandler(data);
                    } catch (e) {}
                }
                
                if (url.includes('PollForReceipt')) {
                    try {
                        const data = await clonedResponse.json();
                        const receipt = data?.data?.receipt;
                        if (receipt) {
                            if (receipt.paymentDetails?.paymentStatus === 'SUCCESS' || 
                                receipt.paymentDetails?.paymentStatus === 'COMPLETED') {
                                trackCheckoutCompletion();
                            }
                        }
                    } catch (e) {}
                }
            }).catch(() => {});
            
            return response;
        };
    })(window, window.fetch);
})();