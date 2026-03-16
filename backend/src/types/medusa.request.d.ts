import "@medusajs/framework/http"

declare module "@medusajs/framework/http" {
    interface MedusaRequest {
        auth_context?: {
            actor_id?: string
            actor_type?: string
        }
    }
}