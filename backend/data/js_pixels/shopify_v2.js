(function () {
    const pixelId = window.pixelClientId;
    if (!pixelId) return;

    // Вставляем Delivr pixel
    const delivrScript = document.createElement('script');
    delivrScript.id = 'delivr-ai';
    delivrScript.src = `https://cdn.pixel.datatagmanager.com/pixels/${pixelId}/p.js`;
    delivrScript.async = true;
    document.body.appendChild(delivrScript);

    function checkPixelInstalled(pixelId, apiUrl) {
        if (!apiUrl) return Promise.resolve(null);

        return fetch(`${apiUrl}/external_api/install-pixel/check-pixel-installed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pixelClientId: pixelId, url: window.location.href })
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
                    <td style="border-right:1px solid #000; color:#1F2C48; height:32px; text-align:left; padding:4px; background:#fff;">Delivr Pixel</td>
                    <td style="text-align:center; padding:4px; background:#fff;">${icon}</td>
                </tr>
            </table>
            ${!success ? `<div style="color: #d00; margin-top: 16px; font-size: 14px; text-align: center;">${message}</div>` : ""}
            ${domain_url ? `
                <div style="text-align:right; margin-top:30px;">
                    <a href="${domain_url}" style="background-color:#3898FC; color:#fff; text-decoration:none; padding:8px 16px; font-size:14px; border-radius:4px; display:inline-block; min-height:25px; line-height:25px;">
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

    const apiUrl = new URLSearchParams(window.location.search).get('api');
    const domain_url = new URLSearchParams(window.location.search).get('domain_url');

    checkPixelInstalled(pixelId, apiUrl).then(res => {
        if (!res) return;

        const pixelInstalled = res.status === 'PIXEL_CODE_INSTALLED';
        createPopup({
            success: pixelInstalled,
            message: pixelInstalled ? '' : 'Pixel ID does not match!',
            domain_url: domain_url ? domain_url : null
        });
    });
})();
