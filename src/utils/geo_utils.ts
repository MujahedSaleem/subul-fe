export function openGoogleMapsApp(lat: number, lng: number) {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    if (isAndroid) {
        // Android: Use geo: URI scheme which works better than comgooglemaps://
        const androidAppUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
        
        try {
            // Create a hidden iframe to test if the app opens
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = androidAppUrl;
            document.body.appendChild(iframe);
            
            // Clean up iframe after a short delay
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 100);
            
            // Fallback to web version after 1.5 seconds if app doesn't open
            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 1500);
        } catch (error) {
            // If iframe method fails, fallback to web
            window.open(webUrl, '_blank');
        }
    } else if (isIOS) {
        // iOS: Try Google Maps app first, then fallback
        const iosAppUrl = `comgooglemaps://?q=${lat},${lng}`;
        
        try {
            window.location.href = iosAppUrl;
            // Fallback to web if app doesn't open
            setTimeout(() => {
                window.open(webUrl, '_blank');
            }, 1500);
        } catch (error) {
            window.open(webUrl, '_blank');
        }
    } else {
        // Desktop: Always use web version
        window.open(webUrl, '_blank');
    }
}
