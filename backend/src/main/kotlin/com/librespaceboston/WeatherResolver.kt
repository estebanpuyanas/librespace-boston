package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import kotlinx.serialization.Serializable

@Serializable
data class WeatherConditions(
    val temperature_fahrenheit: Int,
    val weather_code: Int,
)

@Serializable
private data class OpenMeteoResponse(
    val current: OpenMeteoCurrent? = null,
)

@Serializable
private data class OpenMeteoCurrent(
    val temperature_2m: Double? = null,
    val weather_code: Int? = null,
)

interface WeatherResolver {
    suspend fun current(
        lat: Double,
        lon: Double,
    ): WeatherConditions?
}

class OpenMeteoWeatherResolver(
    private val baseUrl: String = envVar("WEATHER_API_URL") ?: "https://api.open-meteo.com/v1/forecast",
    private val httpClient: HttpClient = defaultChromaHttpClient(),
) : WeatherResolver {
    override suspend fun current(
        lat: Double,
        lon: Double,
    ): WeatherConditions? {
        val url = "$baseUrl?latitude=$lat&longitude=$lon&current=temperature_2m,weather_code&temperature_unit=fahrenheit"
        val response = runCatching { httpClient.get(url).body<OpenMeteoResponse>() }.getOrNull()
        val temperature = response?.current?.temperature_2m ?: return null
        val weatherCode = response.current.weather_code ?: return null
        return WeatherConditions(temperature_fahrenheit = temperature.toInt(), weather_code = weatherCode)
    }
}
