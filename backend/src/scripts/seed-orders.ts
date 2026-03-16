import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function seedOrders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const orderModuleService = container.resolve(Modules.ORDER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const customerModuleService = container.resolve(Modules.CUSTOMER);
  const regionModuleService = container.resolve(Modules.REGION);
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  logger.info("Seeding orders for dashboard demo...");

  // 1. Get Region
  const regions = await regionModuleService.listRegions();
  if (regions.length === 0) {
    logger.error("No regions found. Please seed regions first.");
    return;
  }
  const region = regions[0];

  // 2. Get Customers
  const customers = await customerModuleService.listCustomers();
  if (customers.length === 0) {
    logger.error("No customers found. Please seed customers first.");
    return;
  }

  // 3. Get Variants
  let variants: any[] = [];
  try {
    variants = await productModuleService.listProductVariants({}, { 
        relations: ["product"] 
    });
    logger.info(`Fetched ${variants.length} variants.`);
  } catch (err) {
    logger.error(`Error listing variants: ${err.message}`);
    return;
  }

  if (variants.length === 0) {
    logger.error("No variants found. Please seed products first.");
    return;
  }

  // 4. Create Historical Orders
  const now = new Date();
  const ordersToCreate: any[] = [];

  for (let i = 0; i < 20; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const randomMonthOffset = Math.floor(Math.random() * 6);
    const orderDate = new Date(now.getFullYear(), now.getMonth() - randomMonthOffset, Math.floor(Math.random() * 28) + 1);
    
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items: any[] = [];
    let orderTotal = 0;

    for (let j = 0; j < numItems; j++) {
      const variant = variants[Math.floor(Math.random() * variants.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = 150000; // Fixed price for simplicity in seeding
      
      items.push({
        title: variant.title,
        variant_id: variant.id,
        quantity: quantity,
        unit_price: price,
        thumbnail: (variant as any).product?.thumbnail || "",
      });
      orderTotal += price * quantity;
    }

    ordersToCreate.push({
      region_id: region.id,
      customer_id: customer.id,
      email: customer.email,
      currency_code: "idr",
      items: items,
      total: orderTotal,
      status: Math.random() > 0.2 ? "completed" : "pending",
      created_at: orderDate,
    });
  }

  logger.info(`Attempting to create ${ordersToCreate.length} orders...`);

  for (const orderData of ordersToCreate) {
    try {
      logger.info(`Creating order for ${orderData.email}...`);
      const createdOrders = await orderModuleService.createOrders([{
        currency_code: orderData.currency_code,
        email: orderData.email,
        customer_id: orderData.customer_id,
        region_id: orderData.region_id,
        items: orderData.items.map((item: any) => ({
          title: item.title,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          thumbnail: item.thumbnail
        }))
      }] as any);
      
      const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : createdOrders;
      logger.info(`Successfully created order: ${createdOrder.id}`);

      try {
        await db("order").where("id", createdOrder.id).update({
          created_at: orderData.created_at
        });
      } catch (dbErr) {
        logger.warn(`Failed to update created_at for ${createdOrder.id}: ${dbErr.message}`);
      }

    } catch (e) {
      logger.error(`Error creating order for ${orderData.email}: ${e.message}`);
      if (e.stack) logger.error(e.stack);
    }
  }

  logger.info("Order seeding completed.");
}
