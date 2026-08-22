package com.librespaceboston

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.transaction
import java.net.URI

data class JdbcConnectionInfo(
    val jdbcUrl: String,
    val username: String?,
    val password: String?,
)

/**
 * Neon (and most Postgres hosts) hand out a libpq-style URI
 * (postgresql://user:pass@host/db?sslmode=require&...) meant for drivers that parse
 * credentials out of the authority. The JDBC driver doesn't — it wants
 * jdbc:postgresql://host/db?... with the credentials passed separately.
 */
fun parseDatabaseUrl(databaseUrl: String): JdbcConnectionInfo {
    val uri = URI(databaseUrl.removePrefix("jdbc:"))
    val userInfo = uri.userInfo?.split(":", limit = 2)
    val hostPort = if (uri.port != -1) "${uri.host}:${uri.port}" else uri.host
    val query = uri.query?.let { "?$it" } ?: ""
    return JdbcConnectionInfo(
        jdbcUrl = "jdbc:postgresql://$hostPort${uri.path}$query",
        username = userInfo?.getOrNull(0),
        password = userInfo?.getOrNull(1),
    )
}

fun requireDatabaseUrl(rawDatabaseUrl: String? = envVar("DATABASE_URL")): String =
    rawDatabaseUrl?.takeIf { it.isNotBlank() } ?: error(
        "DATABASE_URL is not set. Run `cp backend/.env.example backend/.env` and fill in " +
            "the Neon connection string before hitting an endpoint that touches the database.",
    )

object AppDatabase {
    /** Idempotent: safe to call against an existing database with the tables already in place. */
    fun connect(databaseUrl: String): Database {
        val info = parseDatabaseUrl(databaseUrl)
        val dataSource =
            HikariDataSource(
                HikariConfig().apply {
                    jdbcUrl = info.jdbcUrl
                    info.username?.let { username = it }
                    info.password?.let { password = it }
                    driverClassName = "org.postgresql.Driver"
                    maximumPoolSize = 5
                },
            )
        try {
            val database = Database.connect(dataSource)
            transaction(database) {
                SchemaUtils.create(Devices, Favorites)
            }
            return database
        } catch (e: Exception) {
            dataSource.close()
            throw e
        }
    }
}
