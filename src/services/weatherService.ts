export interface WeatherInfo {
    temperature: number;
    condition: string;
    icon: string;
}

/**
 * Maps Open-Meteo weather codes to accessible descriptions and icons
 * @param code WMO Weather interpretation codes
 */
const mapWeatherCode = (code: number): { condition: string; icon: string } => {
    if (code === 0) return { condition: 'Despejado', icon: '☀️' };
    if (code >= 1 && code <= 3) return { condition: 'Parcialmente nublado', icon: '⛅' };
    if (code >= 45 && code <= 48) return { condition: 'Niebla', icon: '🌫️' };
    if (code >= 51 && code <= 55) return { condition: 'Llovizna', icon: '🌧️' };
    if (code >= 61 && code <= 65) return { condition: 'Lluvia', icon: '🌧️' };
    if (code >= 71 && code <= 77) return { condition: 'Nieve', icon: '❄️' };
    if (code >= 80 && code <= 82) return { condition: 'Chubascos', icon: '🌦️' };
    if (code >= 95 && code <= 99) return { condition: 'Tormenta', icon: '⛈️' };
    return { condition: 'Variable', icon: '🌡️' };
};

export const getDestinationWeather = async (lat: number, lng: number): Promise<WeatherInfo | null> => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Weather API error');

        const data = await response.json();
        const current = data.current_weather;
        const mapping = mapWeatherCode(current.weathercode);

        return {
            temperature: Math.round(current.temperature),
            condition: mapping.condition,
            icon: mapping.icon
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
};
