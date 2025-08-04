export function openGoogleMapsApp(lat: number, lng: number) {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    if (isAndroid) {
        // Android: Use geo: URI scheme to open app picker
        const androidAppUrl = `geo:${lat},${lng}?q=${lat},${lng}`;
        
        try {
            // Open the app picker directly
            window.location.href = androidAppUrl;
        } catch (error) {
            // Only fallback to web if there's an actual error
            console.error('Error opening map app:', error);
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
