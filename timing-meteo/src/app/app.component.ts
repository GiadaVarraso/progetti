import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TimerComponent } from './timer/timer.component';
import { WeatherService, WeatherCheck } from './services/weather.service';

interface NominatimAddress {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule, TimerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true
})
export class AppComponent implements OnInit {
  addressControl = new FormControl('');
  suggestions: NominatimAddress[] = [];
  isLoading = false;
  isWeatherLoading = false;
  selectedAddress: NominatimAddress | null = null;
  weatherCheck: WeatherCheck | null = null;
  weatherError: string | null = null;
  
  constructor(
    private http: HttpClient,
    private weatherService: WeatherService
  ) {}

  ngOnInit() {
    this.addressControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 3) {
          // Reset weather and address info when input is cleared
          this.resetWeatherState();
          this.selectedAddress = null;
          return of([]);
        }
        
        this.isLoading = true;
        return this.http.get<NominatimAddress[]>(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(term)}&countrycodes=it&addressdetails=1`
        ).pipe(
          tap(() => this.isLoading = false)
        );
      })
    ).subscribe(results => {
      this.suggestions = results;
    });
  }

  private resetWeatherState() {
    this.weatherCheck = null;
    this.weatherError = null;
    this.isWeatherLoading = false;
  }

  selectAddress(address: NominatimAddress) {
    this.addressControl.setValue(address.display_name);
    this.suggestions = [];
    this.selectedAddress = address;
  }

  checkWeather(timeRange: { startTime: Date; endTime: Date }) {
    if (!this.selectedAddress) {
      this.weatherError = "Seleziona prima un indirizzo";
      this.weatherCheck = null;
      return;
    }

    this.isWeatherLoading = true;
    this.weatherError = null;
    this.weatherCheck = null;

    this.weatherService.checkWeatherForPeriod(
      parseFloat(this.selectedAddress.lat),
      parseFloat(this.selectedAddress.lon),
      timeRange.startTime,
      timeRange.endTime
    ).pipe(
      catchError(error => {
        this.weatherError = "Errore nel caricamento delle previsioni meteo";
        return of(null);
      })
    ).subscribe(result => {
      this.isWeatherLoading = false;
      if (result) {
        this.weatherCheck = result;
      }
    });
  }
}
