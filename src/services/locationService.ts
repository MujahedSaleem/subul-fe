export const getCurrentLocation = async (): Promise<{
    coordinates?: string;
    error?: string;
  }> => {
    try {
      // Fetch the current position using the Geolocation API
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
  
      // Extract latitude and longitude
      const { latitude, longitude } = position.coords;
      const coordinates = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      return { coordinates };
    } catch (error) {
      // Handle errors from the Geolocation API
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            return { error: "تم رفض إذن الوصول للموقع." };
          case error.POSITION_UNAVAILABLE:
            return { error: "معلومات الموقع غير متوفرة." };
          case error.TIMEOUT:
            return { error: "انتهت مهلة طلب الموقع." };
          default:
            return { error: "حدث خطأ أثناء تحديد الموقع." };
        }
      } else {
        return { error: "حدث خطأ غير متوقع." };
      }
    }
  };