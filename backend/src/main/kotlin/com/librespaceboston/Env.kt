package com.librespaceboston

import io.github.cdimascio.dotenv.dotenv

/**
 * The JVM doesn't auto-load `.env` files the way Node/Vite/Expo/Python do. `System.getenv`
 * only sees real OS environment variables. This loads `backend/.env` (copied from
 * `.env.example`) and falls back to it when a real env var isn't set, so local dev works the
 * same way as the rest of the stack while still letting a real deployment override via actual
 * environment variables.
 */
private val dotenv =
    dotenv {
        directory = "./"
        ignoreIfMissing = true
    }

fun envVar(key: String): String? = System.getenv(key) ?: dotenv[key]
