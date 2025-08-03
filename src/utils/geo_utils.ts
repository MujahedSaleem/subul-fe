export function openGoogleMapsApp(lat: number, lng: number) {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

	const appUrl = `comgooglemaps://?q=${lat},${lng}`;
	const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&directionsmode=driving`;

    if (isMobileDevice) {
        window.location.href = appUrl;
    } else {
        window.open(webUrl, '_blank');
    }
}
