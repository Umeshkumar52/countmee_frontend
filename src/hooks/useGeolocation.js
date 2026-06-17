import { useState, useEffect, useRef } from 'react';

export const useGeolocation = (active, onLocationUpdate) => {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);

  useEffect(() => {
    if (!active) {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
        watcherRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });
      setError(null);
      if (onLocationUpdate) {
        onLocationUpdate({ latitude, longitude });
      }
    };

    const handleError = (err) => {
      let message = 'An unknown error occurred.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'User denied the request for Geolocation.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          message = 'The request to get user location timed out.';
          break;
        default:
          break;
      }
      setError(message);
    };

    // Use watchPosition to stream changes when user moves
    watcherRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watcherRef.current !== null) {
        navigator.geolocation.clearWatch(watcherRef.current);
      }
    };
  }, [active, onLocationUpdate]);

  return { coords, error };
};
export default useGeolocation;
