package com.librespaceboston

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import kotlinx.serialization.Serializable

private const val BOSTON_MIN_LAT = 42.2
private const val BOSTON_MAX_LAT = 42.45
private const val BOSTON_MIN_LON = -71.2
private const val BOSTON_MAX_LON = -70.9

interface LocationResolver {
    suspend fun resolve(clientIp: String?): ResolvedLocation?
}

data class IpLocationConfig(
    val baseUrl: String = envVar("IP_GEOLOCATION_URL") ?: "https://ipapi.co",
) {
    fun lookupUrl(ip: String): String = "${baseUrl.trimEnd('/')}/$ip/json/"
}

@Serializable
private data class IpLocationResponse(
    val city: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
)

class IpLocationResolver(
    private val config: IpLocationConfig = IpLocationConfig(),
    private val httpClient: HttpClient = defaultChromaHttpClient(),
) : LocationResolver {
    override suspend fun resolve(clientIp: String?): ResolvedLocation? {
        val ip = clientIp?.takeIf(::isPublicIp) ?: return null
        val response = runCatching { httpClient.get(config.lookupUrl(ip)).body<IpLocationResponse>() }.getOrNull()
        val lat = response?.latitude ?: return null
        val lon = response.longitude ?: return null
        if (lat !in BOSTON_MIN_LAT..BOSTON_MAX_LAT || lon !in BOSTON_MIN_LON..BOSTON_MAX_LON) return null

        return ResolvedLocation(
            lat = lat,
            lon = lon,
            source = "ip",
            label = response.city?.let { "Near $it (approximate)" } ?: "Approximate Boston area",
            approximate = true,
        )
    }
}

private fun isPublicIp(ip: String): Boolean {
    if (!Regex("^\\d{1,3}(\\.\\d{1,3}){3}$").matches(ip)) return false
    if (ip == "0.0.0.0" || ip.startsWith("10.") || ip.startsWith("127.") || ip.startsWith("192.168.")) return false
    if (ip.startsWith("169.254.")) return false
    val secondOctet = ip.substringAfter('.').substringBefore('.').toIntOrNull() ?: return false
    return !(ip.startsWith("172.") && secondOctet in 16..31)
}
