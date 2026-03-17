
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { cart_id } = req.body as { cart_id: string };

  if (!cart_id) {
    return res.status(400).json({ message: "Cart ID is required" });
  }

  const query = req.scope.resolve("query");
  const orderModule = req.scope.resolve(Modules.ORDER);
  const cartModule = req.scope.resolve(Modules.CART);
  const inventoryModule = req.scope.resolve(Modules.INVENTORY);

  try {
    // 1. Ambil data keranjang lengkap + Inventory Item ID-nya
    const { data: [cart] } = await query.graph({
      entity: "cart",
      fields: [
        "id", "region_id", "email", "currency_code", "customer_id",
        "items.*",
        "items.variant.inventory_items.inventory_item_id", // Ambil link ke inventory
        "shipping_address.*"
      ],
      filters: { id: cart_id }
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // 2. Tentukan Diskon dari database (Metadata Customer Group)
    const customer = cart.customer_id ? await (req.scope.resolve(Modules.CUSTOMER) as any).retrieveCustomer(cart.customer_id, { relations: ["groups"] }) : null;
    const role = customer?.metadata?.role || "INDIVIDUAL";
    
    // Ambil discount_rate dari metadata group di database
    let discountRate = 0;
    if (customer?.groups?.length) {
      for (const group of customer.groups) {
        const rate = (group as any).metadata?.discount_rate;
        if (rate && Number(rate) > discountRate) {
          discountRate = Number(rate);
        }
      }
    }

    let subtotal = 0;
    const items = (cart.items || []).filter(Boolean).map((item: any) => {
      const unitPrice = item.unit_price || 0;
      // Jika sudah ter-diskon di cart, kita hitung harga aslinya buat dicatet
      const originalPrice = discountRate > 0 ? Math.round(unitPrice / (1 - discountRate)) : unitPrice;
      subtotal += (originalPrice * item.quantity);

      return {
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: unitPrice,
        variant_id: item.variant_id,
        thumbnail: item.thumbnail,
        metadata: {
          original_price: originalPrice,
          discount_applied: discountRate > 0 ? `${discountRate * 100}%` : "0%"
        }
      };
    });

    const total = cart.items.reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);

    // 3. Buat Order dengan Metadata Lengkap
    const orderData = {
      currency_code: cart.currency_code,
      email: cart.email || "",
      region_id: cart.region_id || undefined,
      customer_id: cart.customer_id || undefined,
      shipping_address: cart.shipping_address || undefined,
      items,
      metadata: {
        billing_summary: {
          subtotal: subtotal,
          discount_total: subtotal - total,
          discount_percent: discountRate * 100,
          customer_role: role
        }
      },
      status: "pending" as any
    };

    const order = await (orderModule as any).createOrders(orderData);

    // 3. LOGIKA POTONG STOK (Manual Adjustment)
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id"]
    });

    const mainLocationId = locations[0]?.id;

    if (mainLocationId) {
      for (const item of (cart.items || []).filter(Boolean)) {
        const inventoryItemId = (item as any).variant?.inventory_items?.[0]?.inventory_item_id;
        if (inventoryItemId) {
          try {
            await inventoryModule.adjustInventory(
              inventoryItemId,
              mainLocationId,
              -Math.abs((item as any).quantity) // Nilai minus = Mengurangi stok
            );
          } catch (e) {
            console.error(`Gagal potong stok untuk item ${(item as any).title}:`, e);
          }
        }
      }
    }

    // 4. Hapus keranjang
    await cartModule.deleteCarts(cart_id);

    return res.json({
      success: true,
      type: "order",
      data: order
    });

  } catch (error: any) {
    console.error("Direct Checkout Error:", error);
    return res.status(500).json({
      message: "Gagal memproses order",
      error: error.message
    });
  }
}
