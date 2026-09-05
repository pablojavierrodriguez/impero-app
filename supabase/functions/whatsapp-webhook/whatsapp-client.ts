/**
 * Cliente para el envío de mensajes de WhatsApp utilizando la API oficial de Meta Cloud
 */
export async function sendWhatsAppTextMessage(
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  text: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    const cleanTo = recipientPhone.replace(/\D/g, "");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { preview_url: false, body: text },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error al enviar mensaje por WhatsApp Cloud API:", data);
      return { success: false, error: data.error?.message || "WhatsApp API Error", data };
    }

    return { success: true, data };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Excepción en sendWhatsAppTextMessage:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
