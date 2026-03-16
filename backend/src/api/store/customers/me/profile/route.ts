import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context?.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { data } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "groups.id",
      "groups.name"
    ],
    filters: { id: customerId }
  })

  const customer = data?.[0]

  res.json({ customer });
}
