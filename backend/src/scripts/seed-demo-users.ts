import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createCustomerAccountWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedDemoUsers({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const userModuleService = container.resolve(Modules.USER)
  const authModuleService = container.resolve(Modules.AUTH)

  logger.info("Seeding demo users (Individual, Distributor, Admin)...")

  const password = "Supersecret123!"

  // =====================================================
  // FETCH CUSTOMER GROUPS
  // =====================================================

  const groups = await customerModuleService.listCustomerGroups({
    name: [
      "Individual",
      "Distributor Bronze",
      "Distributor Silver",
      "Distributor Gold",
    ],
  } as any)

  const getGroup = (name: string) =>
    groups.find((g) => g.name === name)

  const individualGroup = getGroup("Individual")
  const bronzeGroup = getGroup("Distributor Bronze")
  const silverGroup = getGroup("Distributor Silver")
  const goldGroup = getGroup("Distributor Gold")

  if (!individualGroup || !bronzeGroup || !silverGroup || !goldGroup) {
    logger.error("Required groups missing. Run setup-tiers first.")
    return
  }

  // =====================================================
  // DEMO CUSTOMERS
  // =====================================================

  const demoCustomers = [
    {
      email: "individual@seiv.com",
      first_name: "Budi",
      last_name: "Santoso",
      group_id: individualGroup.id,
    },
    {
      email: "distributorbronze@seiv.com",
      first_name: "TB",
      last_name: "Maju Bronze",
      group_id: bronzeGroup.id,
    },
    {
      email: "distributorsilver@seiv.com",
      first_name: "Toko",
      last_name: "Sejahtera Silver",
      group_id: silverGroup.id,
    },
    {
      email: "distributorgold@seiv.com",
      first_name: "Depo",
      last_name: "Mega Gold",
      group_id: goldGroup.id,
    },
  ]

  for (const data of demoCustomers) {
    logger.info(`Processing ${data.email}`)

    const [existingCustomer] =
      await customerModuleService.listCustomers({
        email: data.email,
      })

    // =====================================================
    // CLEANUP IF EXISTS
    // =====================================================

    if (existingCustomer) {
      logger.info(`Deleting existing customer ${data.email}`)

      const authIdentities =
        await authModuleService.listAuthIdentities({
          entity_id: data.email,
        } as any)

      if (authIdentities.length) {
        await authModuleService.deleteAuthIdentities(
          authIdentities.map((i) => i.id)
        )
      }

      await new Promise((r) => setTimeout(r, 200))

      await customerModuleService.deleteCustomers([
        existingCustomer.id,
      ])
    }

    // =====================================================
    // REGISTER AUTH
    // =====================================================

    logger.info(`Registering auth for ${data.email}`)

    const regResponse = await authModuleService.register(
      "emailpass",
      {
        body: {
          email: data.email,
          password,
        },
        url: "",
        headers: {},
        query: {},
        protocol: "http",
      } as any
    )

    if (!regResponse.success || !regResponse.authIdentity) {
      logger.error(
        `Auth registration failed for ${data.email}: ${regResponse.error}`
      )
      continue
    }

    // =====================================================
    // CREATE CUSTOMER VIA WORKFLOW
    // =====================================================

    const { result: newCustomer } =
      await createCustomerAccountWorkflow(container).run({
        input: {
          authIdentityId: regResponse.authIdentity.id,

          customerData: {
            email: data.email,
            first_name: data.first_name,
            last_name: data.last_name,

            metadata: {
              role: data.email.includes("silver")
                ? "DISTRIBUTOR_SILVER"
                : data.email.includes("gold")
                  ? "DISTRIBUTOR_GOLD"
                  : data.email.includes("bronze")
                    ? "DISTRIBUTOR_BRONZE"
                    : "INDIVIDUAL",
            },
          },
        },
      })

    if (!newCustomer?.id) {
      logger.error(`Customer creation failed for ${data.email}`)
      continue
    }

    // =====================================================
    // ADD CUSTOMER TO GROUP
    // =====================================================

    await customerModuleService.addCustomerToGroup({
      customer_id: newCustomer.id,
      customer_group_id: data.group_id,
    })

    logger.info(
      `Customer ${data.email} created and added to group ${data.group_id}`
    )
  }

  logger.info("Demo user seeding completed.")
}