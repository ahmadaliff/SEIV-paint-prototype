import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000,http://localhost:3001,http://localhost:5173",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001,http://localhost:3000,http://localhost:5173",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:3001,http://localhost:5173",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
            options: {}
          }
        ]
      }
    }
  ]
})
