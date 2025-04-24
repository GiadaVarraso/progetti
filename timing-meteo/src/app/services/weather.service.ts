import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WeatherForecast {
  time: string;
  precipitation_probability: number;
  weathercode: number;
}

export interface WeatherCheck {
  hasBadWeather: boolean;
  forecasts: WeatherForecast[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(private http: HttpClient) {}

  private getWeatherDescription(code: number): string {
    switch (code) {
      case 0: return 'sereno';
      case 1: return 'poco nuvoloso';
      case 2: return 'parzialmente nuvoloso';
      case 3: return 'nuvoloso';
      case 45:
      case 48: return 'nebbia';
      case 51:
      case 53:
      case 55: return 'pioggia leggera';
      case 61:
      case 63:
      case 65: return 'pioggia';
      case 66:
      case 67: return 'pioggia gelata';
      case 71:
      case 73:
      case 75: return 'neve';
      case 77: return 'grandine';
      case 80:
      case 81:
      case 82: return 'rovesci di pioggia';
      case 85:
      case 86: return 'rovesci di neve';
      case 95: return 'temporale';
      case 96:
      case 99: return 'temporale con grandine';
      default: return 'condizioni meteo sconosciute';
    }
  }

  private isBadWeather(code: number): boolean {
    // Consider as bad weather: rain, snow, thunderstorm, etc.
    return code > 50;
  }

  checkWeatherForPeriod(lat: number, lon: number, startTime: Date, endTime: Date): Observable<WeatherCheck> {
    const params = {
      latitude: lat.toString(),
      longitude: lon.toString(),
      hourly: 'weathercode,precipitation_probability',
      timezone: 'auto'
    };

    const url = `${this.apiUrl}?${new URLSearchParams(params)}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const forecasts = response.hourly.time.map((time: string, index: number) => ({
          time,
          weathercode: response.hourly.weathercode[index],
          precipitation_probability: response.hourly.precipitation_probability[index]
        })).filter((forecast: WeatherForecast) => {
          const forecastDate = new Date(forecast.time);
          return forecastDate >= startTime && forecastDate <= endTime;
        });

        const warnings: string[] = [];
        let hasBadWeather = false;

        forecasts.forEach((forecast: WeatherForecast) => {
          if (this.isBadWeather(forecast.weathercode)) {
            hasBadWeather = true;
            const time = new Date(forecast.time).toLocaleTimeString('it-IT', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const description = this.getWeatherDescription(forecast.weathercode);
            warnings.push(`${time}: ${description} (probabilità precipitazioni: ${forecast.precipitation_probability}%)`);
          }
        });

        return {
          hasBadWeather,
          forecasts,
          warnings
        };
      })
    );
  }
}