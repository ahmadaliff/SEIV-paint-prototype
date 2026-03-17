
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  const orderModule = req.scope.resolve(Modules.ORDER);

  try {
    // Map ke internal status Medusa (v2)
    let medusaStatus = "pending";
    if (status === "Completed") medusaStatus = "completed";
    if (status === "Processing") medusaStatus = "requires_action";
    if (status === "Pending" || status === "Paid" || status === "Shipped") medusaStatus = "pending";
    if (status === "Batal") medusaStatus = "canceled";

    // Paksa update status dan metadata di level database
    // Di Medusa v2, updateOrders menerima array
    const updatedOrders = await (orderModule as any).updateOrders([{
      id,
      status: medusaStatus,
      metadata: {
        custom_status: status // Simpan status label asli kita (Processing, Shipped, dll)
      }
    }]);

    return res.json({ 
      success: true, 
      order: updatedOrders[0] 
    });
  } catch (error: any) {
    console.error("Error forced status update:", error);
    return res.status(500).json({ 
      message: "Gagal update status di backend", 
      error: error.message 
    });
  }
}
