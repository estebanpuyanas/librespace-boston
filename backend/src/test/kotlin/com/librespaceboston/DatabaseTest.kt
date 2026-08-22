package com.librespaceboston

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class DatabaseTest {
    @Test
    fun parsesANeonStyleConnectionStringIntoAJdbcUrlAndSeparateCredentials() {
        val info = parseDatabaseUrl("postgresql://neondb_owner:secret-pw@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require")

        assertEquals("jdbc:postgresql://ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require", info.jdbcUrl)
        assertEquals("neondb_owner", info.username)
        assertEquals("secret-pw", info.password)
    }

    @Test
    fun preservesAnExplicitPort() {
        val info = parseDatabaseUrl("postgresql://user:pw@localhost:5432/mydb")

        assertEquals("jdbc:postgresql://localhost:5432/mydb", info.jdbcUrl)
    }

    @Test
    fun handlesAUrlWithNoCredentials() {
        val info = parseDatabaseUrl("postgresql://localhost/mydb")

        assertNull(info.username)
        assertNull(info.password)
        assertEquals("jdbc:postgresql://localhost/mydb", info.jdbcUrl)
    }

    @Test
    fun requireDatabaseUrlFailsLoudlyWhenUnset() {
        assertFailsWith<IllegalStateException> { requireDatabaseUrl(null) }
    }

    @Test
    fun requireDatabaseUrlFailsLoudlyWhenBlank() {
        assertFailsWith<IllegalStateException> { requireDatabaseUrl("  ") }
    }

    @Test
    fun requireDatabaseUrlPassesThroughAValidValue() {
        assertEquals("postgresql://localhost/mydb", requireDatabaseUrl("postgresql://localhost/mydb"))
    }
}
