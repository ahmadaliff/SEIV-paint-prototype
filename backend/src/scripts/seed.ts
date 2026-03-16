import { ExecArgs, CreateInventoryLevelInput, ShippingProfileDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  createProductCategoriesWorkflow,
  createPriceListsWorkflow,
  createCustomerGroupsWorkflow,
  createShippingProfilesWorkflow,
  updateStockLocationsWorkflow,
  createStockLocationsWorkflow,
  createRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const productService = container.resolve(Modules.PRODUCT)

  logger.info("Starting SEIV Paint seed...")

  // 1. SALES CHANNEL
  let { data: allChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"]
  })

  let defaultSalesChannel: any = allChannels.find(sc => sc.name.toLowerCase().includes("default")) || allChannels[0]

  if (!defaultSalesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "Default Sales Channel" }
        ]
      }
    })
    defaultSalesChannel = result[0]
  }
  logger.info(`Using Sales Channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)

  // 2. SHIPPING PROFILE
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
  })

  let shippingProfile = existingProfiles.find(
    (p) => p.name === "Default Shipping"
  ) as ShippingProfileDTO | undefined

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Default Shipping",
            type: "default",
          },
        ],
      },
    })

    shippingProfile = result[0]
  }

  // 3. PRODUCT CATEGORIES
  const categoryNames = [
    "Cat Tembok",
    "Cat Kayu & Besi",
    "Pelapis Anti Bocor",
    "Thinner & Solvent",
    "Cat Semprot",
    "Perlengkapan"
  ]

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"]
  })

  const existingNames = existingCategories.map((c: any) => c.name)
  const categoriesToCreate = categoryNames
    .filter(name => !existingNames.includes(name))
    .map(name => ({ name }))

  if (categoriesToCreate.length > 0) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: categoriesToCreate }
    })
    logger.info("Categories created")
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"]
  })

  // 4. PRODUCTS
  logger.info("Creating products...")
  const templateImage =
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=1200&auto=format&fit=crop"

  const productsData = [
    {
      title: "SEIV Paint Eksterior Weathershield",
      handle: "seiv-eksterior-weathershield",
      price: 250000,
      category: "Cat Tembok",
      specs: { coverage: "10-12 m²/L", dry_time: "2 jam", coats: "2 lapis", finish: "Semi-Gloss" }
    },
    {
      title: "SEIV Paint Interior Anti-Noda",
      handle: "seiv-interior-anti-noda",
      price: 215000,
      category: "Cat Tembok",
      specs: { coverage: "12-14 m²/L", dry_time: "1 jam", coats: "2 lapis", finish: "Matt" }
    },
    {
      title: "SEIV Enamel Kayu & Besi",
      handle: "seiv-enamel-kayu-besi",
      price: 180000,
      category: "Cat Kayu & Besi",
      specs: { coverage: "8-10 m²/L", dry_time: "4 jam", coats: "1-2 lapis", finish: "Gloss" }
    },
    {
      title: "SEIV Waterproof Coating",
      handle: "seiv-waterproof-coating",
      price: 270000,
      category: "Pelapis Anti Bocor",
      specs: { coverage: "2 m²/kg", dry_time: "3 jam", coats: "3 lapis", finish: "Elastomeric" }
    },
    {
      title: "SEIV Thinner Premium",
      handle: "seiv-thinner-premium",
      price: 90000,
      category: "Thinner & Solvent",
      specs: { coverage: "-", dry_time: "-", coats: "-", finish: "-" }
    },
    {
      title: "SEIV Spray Paint",
      handle: "seiv-spray-paint",
      price: 65000,
      category: "Cat Semprot",
      specs: { coverage: "1.5 m²/can", dry_time: "15 menit", coats: "2-3 lapis", finish: "Varies" }
    }
  ]

  const paintColors = [
    { name: "Putih Arctic", priceAdd: 0, hex: "#f8fafc" },
    { name: "Kuning Cerah", priceAdd: 5000, hex: "#fde047" },
    { name: "Coklat Tua", priceAdd: 10000, hex: "#78350f" },
    { name: "Merah Bata", priceAdd: 15000, hex: "#c2410c" }
  ]
  const paintSizes = [
    { label: "2.5 kg", multiplier: 1 },
    { label: "5 kg", multiplier: 1.8 },
    { label: "20 kg", multiplier: 6.5 }
  ]

  for (const p of productsData) {
    const [existing] = await productService.listProducts({ handle: p.handle })

    // Create color map for frontend metadata
    const colorMap: Record<string, string> = {}
    paintColors.forEach(c => {
      colorMap[c.name] = c.hex
    })

    const metadata = {
      color_map: colorMap,
      specs: p.specs
    }

    if (existing) {
      // Update metadata even if product exists
      await productService.updateProducts(existing.id, {
        metadata: {
          ...existing.metadata,
          ...metadata
        }
      })
      continue
    }

    const category = categories.find((c: any) => c.name === p.category)
    const variants = paintSizes.flatMap(size =>
      paintColors.map(color => {
        const baseAmount = Math.round((p.price + color.priceAdd) * size.multiplier);
        return {
          title: `${size.label} / ${color.name}`,
          sku: `${p.handle}-${size.label}-${color.name}-${Math.floor(Math.random() * 1000)}`.replace(/\s+/g, "-"),
          options: { Ukuran: size.label, Warna: color.name },
          manage_inventory: true,
          prices: [
            {
              amount: baseAmount,
              currency_code: "idr",
              rules: {}
            }
          ]
        };
      })
    )

    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            handle: p.handle,
            description: "Cat premium berkualitas tinggi dengan perlindungan maksimal.",
            thumbnail: templateImage,
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile!.id,
            category_ids: category ? [category.id] : [],
            sales_channels: [{ id: defaultSalesChannel.id }],
            metadata,
            options: [
              { title: "Ukuran", values: paintSizes.map(s => s.label) },
              { title: "Warna", values: paintColors.map(c => c.name) }
            ],
            variants
          }
        ]
      }
    })

    logger.info(`Product created: ${p.title}`)
  }

  // 5. STOCK LOCATIONS
  const branchCoordinates: Record<string, any> = {
    jakarta: { lat: -6.2088, lng: 106.8456 },
    tangerang: { lat: -6.1783, lng: 106.6319 },
    bekasi: { lat: -6.2383, lng: 106.9756 },
    bandung: { lat: -6.9175, lng: 107.6191 },
    semarang: { lat: -6.9667, lng: 110.4167 },
    cirebon: { lat: -6.7320, lng: 108.5523 },
    surabaya: { lat: -7.2575, lng: 112.7521 },
    manado: { lat: 1.4748, lng: 124.8421 }
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "metadata"]
  })

  for (const branchKey of Object.keys(branchCoordinates)) {
    const coords = branchCoordinates[branchKey]

    const existingLocation = stockLocations.find((loc) =>
      loc.name?.toLowerCase().includes(branchKey)
    )

    if (existingLocation) {
      await updateStockLocationsWorkflow(container).run({
        input: {
          selector: { id: existingLocation.id },
          update:
          {
            metadata: {
              ...(existingLocation.metadata || {}),
              lat: coords.lat,
              lng: coords.lng,
            },
          },
        },
      })
    } else {
      await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: branchKey,
              metadata: {
                lat: coords.lat,
                lng: coords.lng,
              },
            },
          ],
        },
      })
    }
  }

  // 6. INVENTORY SEEDING
  const { data: allVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "price_set.id", "price_set.prices.amount", "price_set.prices.currency_code", "inventory_items.inventory_item_id"]
  }) as { data: any[] }

  const { data: latestLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"]
  })

  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["location_id", "inventory_item_id"]
  })

  const inventoryLevels: CreateInventoryLevelInput[] = []

  for (const variant of allVariants) {
    const itemId = variant.inventory_items?.[0]?.inventory_item_id
    if (!itemId) continue

    for (const location of latestLocations) {
      const exists = existingLevels.some(
        (lvl) => lvl.location_id === location.id && lvl.inventory_item_id === itemId
      )
      if (exists) continue

      let stock = 1000
      const name = location.name?.toLowerCase() || ""
      if (name.includes("jakarta")) stock = 1500
      if (name.includes("tangerang")) stock = 2000
      if (name.includes("bekasi")) stock = 1200
      if (name.includes("bandung")) stock = 900
      if (name.includes("semarang")) stock = 800
      if (name.includes("cirebon")) stock = 700
      if (name.includes("surabaya")) stock = 1300
      if (name.includes("manado")) stock = 500

      inventoryLevels.push({
        location_id: location.id,
        stocked_quantity: stock,
        inventory_item_id: itemId
      })
    }
  }

  if (inventoryLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryLevels }
    })
    logger.info(`Inventory seeded: ${inventoryLevels.length} new levels across ${latestLocations.length} locations`)
  }

  // 7. LINK SALES CHANNEL
  const slLinks = latestLocations.map(loc => ({
    [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
    [Modules.STOCK_LOCATION]: { stock_location_id: loc.id }
  }))

  try {
    await remoteLink.create(slLinks)
    logger.info(`✅ Linked ${latestLocations.length} locations to channel: ${defaultSalesChannel.name}`)
  } catch (e: any) {
    logger.warn(`Link warning: ${e.message}`)
  }

  // 8. CUSTOMER GROUPS & PRICE LISTS
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  const regionModuleService = container.resolve(Modules.REGION)

  logger.info("Setting up Customer Tiers and Price Lists...")

  const existingGroups = await customerModuleService.listCustomerGroups()
  const groupNames = ["Individual", "Distributor Bronze", "Distributor Silver", "Distributor Gold"]
  const missingGroups = groupNames.filter(name => !existingGroups.find(g => g.name === name))

  let groups = [...existingGroups]
  if (missingGroups.length > 0) {
    const { result } = await createCustomerGroupsWorkflow(container).run({
      input: { customersData: missingGroups.map(name => ({ name })) }
    })
    groups = [...groups, ...result]
  }

  const getGroup = (name: string) => groups.find((g: any) => g.name === name)

  let [region] = await regionModuleService.listRegions({ name: "Indonesia" })
  if (!region) {
    const { result: newRegions } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Indonesia",
            currency_code: "idr",
            is_tax_inclusive: false,
            countries: ["id"]
          },
        ],
      },
    })
    region = newRegions[0]
  }

  const tiers = [
    { name: "Bronze", discount: 0.10 },
    { name: "Silver", discount: 0.15 },
    { name: "Gold", discount: 0.20 }
  ]

  const pricingModuleService = container.resolve(Modules.PRICING)
  const existingPriceLists = await pricingModuleService.listPriceLists({ id: [] })

  const toDelete = existingPriceLists.filter(p => tiers.some(t => p.title?.includes(t.name)))
  if (toDelete.length > 0) {
    await pricingModuleService.deletePriceLists(toDelete.map(p => p.id))
  }

  const priceListsData = tiers.map(t => {
    const prices: any[] = []// Hanya ambil variant yang punya price_set dan harga
    const validVariants = allVariants.filter(v => v.id && v.price_set?.prices?.length > 0)
    for (const v of validVariants) {
      const basePriceObj = v.price_set.prices.find((p: any) => p.currency_code === 'idr')
      if (!basePriceObj) continue

      const group = getGroup(`Distributor ${t.name}`)
      if (!group) return null

      prices.push({
        amount: Math.round(basePriceObj.amount * (1 - t.discount)),
        currency_code: "idr",
        price_set_id: v.price_set!.id,
        rules: {
          "customer.groups.id": group.id,
        }
      })
    }

    if (prices.length === 0) return null


    return {
      title: `${t.name} Tier`,
      description: `Diskon spesial untuk ${t.name}`,
      type: "sale",
      status: "active",
      prices,
    }
  }).filter(Boolean) as any[]
  if (priceListsData.length > 0) {
    try {
      await pricingModuleService.createPriceLists(priceListsData)
      logger.info(`✅ Successfully created ${priceListsData.length} Price Lists via Service.`)
    } catch (err: any) {
      logger.error(`❌ Pricing Service Error: ${err.message}`)
    }
  }
  logger.info("SEIV Paint seed completed successfully")
}