# SPEC-008: Agente IA de Ingesta Autónoma & Bot de WhatsApp (P1)

## 1. Contexto & Diagnóstico

El principal factor de abandono en las aplicaciones de finanzas personales es la **fricción de carga**. Aunque la importación de extractos por CSV/PDF resuelve el historial retrospectivo masivo, el registro cotidiano de gastos de bolsillo, salidas informales o pagos inmediatos sigue requiriendo que el usuario abra la aplicación web/móvil, navegue hasta el formulario y complete campos manualmente.

WhatsApp es la aplicación con mayor retención, ubicuidad y frecuencia de uso en Latinoamérica. Convertir a **m3** en un contacto de WhatsApp al que se le pueda enviar un audio, una foto de un ticket o un mensaje rápido elimina por completo la fricción de entrada ("zero-friction tracking").

---

## 2. Objetivos del Producto

1. **Ingesta Conversacional (Texto y Audio)**:
   - Interpretar mensajes coloquiales en lenguaje natural (ej. *"Gasté $8.500 en la farmacia con Galicia"*).
   - Procesar notas de voz (Voice-to-Text con Whisper) y extraer las entidades financieras clave.
2. **Ingesta Visual Multimodal (Tickets y Comprobantes)**:
   - Recibir fotos de tickets físicos de papel o capturas de pantalla de comprobantes de transferencia (Mercado Pago, Modo, Santander, etc.).
   - Extraer monto total, fecha, comercio/destinatario y predecir categoría y cuenta utilizada.
3. **Ingesta Documental (Extractos CSV / PDF)**:
   - Permitir al usuario arrastrar o reenviar al chat de WhatsApp sus extractos bancarios o resúmenes de tarjeta.
   - Procesar el documento, detectar cuotas y transferencias propias, y responder con un resumen de conciliación antes de confirmar.
4. **Sincronización Inmediata en m3**:
   - Cada movimiento confirmado impacta en tiempo real en la base de datos PostgreSQL de Supabase, actualizando saldos de cuentas y presupuestos al instante.
5. **Feedback y Confirmación al Usuario**:
   - Responder por WhatsApp con una confirmación clara y concisa (ej. *"✅ Registrado: $8.500 en Salud (Galicia) · Saldo restante en categoría: $32.000"*).

---

## 3. Arquitectura Técnica

```
 ┌──────────────────────┐
 │  Usuario (WhatsApp)  │
 └──────────┬───────────┘
            │ Mensaje: Texto / Audio / Imagen / Documento
            ▼
 ┌────────────────────────────────────────────────────────┐
 │  Webhook Gateway (Edge Function / API Route en Node)   │
 │  - Valida firma del proveedor (Meta Cloud API / Twilio)│
 │  - Autentica al usuario por número de teléfono en DB  │
 └──────────────────────────┬─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
    [Texto / Audio / Imagen]        [Documentos PDF/CSV]
            │                               │
            ▼                               ▼
 ┌─────────────────────────────┐   ┌─────────────────────────────┐
 │  Agente LLM Multimodal      │   │  Parser de Extractos (m3)   │
 │  - Audio: Whisper API       │   │  - csv-parser engine        │
 │  - Visión: Gemini / GPT-4o  │   │  - Detección de cuotas      │
 │  - Structured Output (JSON) │   │  - Detección transferencias │
 └──────────────┬──────────────┘   └──────────────┬──────────────┘
                │                                 │
                ▼                                 ▼
 ┌────────────────────────────────────────────────────────┐
 │  Capa de Normalización & Lógica de Negocio (m3 Core)   │
 │  - Mapeo a Category existente del usuario              │
 │  - Mapeo a Account existente                           │
 │  - Detección de duplicados                             │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │  Supabase (PostgreSQL + RLS)                           │
 │  - Inserción en `public.transactions`                  │
 │  - Recálculo de balances en `public.accounts`          │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │  Respuesta WhatsApp al Usuario                         │
 │  - Mensaje de confirmación / Botones interactivos     │
 └────────────────────────────────────────────────────────┘
```

---

## 4. Componentes y Capas de Implementación

### A. Vinculación y Seguridad de Usuario
- **Tabla `public.user_profiles` o `public.integrations`**:
  - Campo `whatsapp_phone_number`: Almacena el número en formato internacional E.164 (ej. `+54911xxxxxxxx`).
  - Campo `whatsapp_enabled`: Flag booleano de activación.
  - Flujo de vinculación: En la pantalla de Ajustes de **m3**, el usuario solicita vincular su WhatsApp; la app genera un código OTP de 6 dígitos que el usuario envía al bot para verificar su identidad.

### B. Gateway de Webhooks (`supabase/functions/whatsapp-webhook` o Node API)
- Endpoint `POST /api/webhook/whatsapp`:
  - Recibe el payload del proveedor (Meta WhatsApp Business Cloud API o Twilio).
  - Valida el token de verificación y la firma HMAC `X-Hub-Signature-256`.
  - Busca el usuario propietario del número de teléfono remitente. Si no está registrado, responde con instrucciones de vinculación.

### C. Motor del Agente de Extracción Estructurada (LLM Pipeline)
- **Extracción con Schema Zod / JSON Schema**:
  ```typescript
  interface ParsedWhatsAppExpense {
    amount: number;
    currency: "ARS" | "USD";
    description: string;
    categoryHint: string;
    accountHint?: string;
    type: "income" | "expense";
    isTransfer?: boolean;
    installmentInfo?: { current: number; total: number };
    date: string; // ISO format
    confidence: number; // 0.0 - 1.0
  }
  ```
- **Procesamiento de Imágenes (Tickets)**:
  - Las imágenes se envían a un modelo multimodal (Gemini Flash / GPT-4o mini Vision) con prompt estructurado para extraer: Total Facturado, Nombre de Fantasía o Razón Social, Fecha, y si figura tarjeta/medio de pago.
- **Procesamiento de Audio**:
  - Audio OGG/Opus de WhatsApp se transcribe vía Whisper API / Gemini Audio a texto y se pasa al extractor de entidades.

### D. Reconciliación con Entidades Existentes de m3
- El agente consulta en DB las cuentas (`accounts`) y categorías (`categories`) activas del usuario.
- Realiza coincidencia semántica / fuzzy matching:
  - *"con la de débito"* o *"Galicia"* -> Cuenta `Banco Galicia Débito`.
  - *"Mercado Pago"* -> Cuenta `Mercado Pago`.
  - Si hay ambigüedad o falta la cuenta, se utiliza la cuenta configurada como principal (`is_primary`) o la billetera más frecuente.

---

## 5. Casos de Uso y Flujos de Conversación

### Caso 1: Gasto rápido por texto
- **Usuario:** `"Cena con amigos 18500 en mostaza mercado pago"`
- **Bot:**
  > ✅ **Gasto registrado: $18.500,00**  
  > 🍔 Categoría: **Dining (Restaurantes)**  
  > 💳 Cuenta: **Mercado Pago**  
  > 📅 Fecha: **Hoy, 04/09**  
  > *(¿Querés cambiar algo? Respondé "editar" o "deshacer")*

### Caso 2: Foto de ticket de supermercado
- **Usuario:** *(Envía foto de ticket de Carrefour)*
- **Bot:**
  > 🧾 **Ticket detectado: Carrefour Express**  
  > 💵 Total: **$34.210,50**  
  > 🛒 Categoría: **Groceries (Supermercado)**  
  > 💳 Cuenta sugerida: **Banco Galicia (Débito)**  
  > ✅ *Guardado en m3 con foto adjunta.*

### Caso 3: Reenvío de resumen o extracto bancario (PDF / CSV)
- **Usuario:** *(Reenvía documento `Extracto_Agosto_Santander.csv`)*
- **Bot:**
  > 📊 **Extracto procesado: 48 movimientos detectados**  
  > • 42 Gastos: $385.400,00  
  > • 4 Ingresos: $950.000,00  
  > • 2 Transferencias propias: $120.000,00  
  > • 3 compras en cuotas identificadas  
  > 👉 [Tocar acá para revisar y confirmar en m3](https://m3.app/import?session=xyz)

---

## 6. Fases de Desarrollo

| Fase | Alcance | Dependencias |
| :---: | :--- | :--- |
| **Fase 1: Motor de Extracción & Prompts** | Endpoint en backend con Zod schema que recibe texto, audio o imagen y devuelve el JSON estandarizado de transacción `m3`. | Proveedor LLM (Gemini API o OpenAI) |
| **Fase 2: Conexión WhatsApp Webhook** | Setup de Meta Cloud API / Twilio Sandbox, validación de firma y vinculación con teléfono de usuario en Supabase. | Cuenta Meta Developer / Twilio |
| **Fase 3: Flujo de Confirmación y Acciones Rápidas** | Respuestas con botones interactivos de WhatsApp (Confirmar / Editar / Deshacer) y persistencia directa en DB. | Servicios `transactions.service.ts` |
| **Fase 4: Ingesta de Documentos y Extractos** | Capacidad de reenviar PDFs y CSVs al bot para procesarlos con el motor de `csv-parser` ya validado en m3. | Pipeline de archivos |

---

## 7. Plan de Verificación & Seguridad

1. **Seguridad & Privacidad**:
   - Rechazo estricto de cualquier mensaje proveniente de números no autorizados o no verificados con OTP.
   - Almacenamiento de imágenes de tickets en bucket privado `receipts` de Supabase Storage asociado al `user_id`.
2. **Validación de Datos**:
   - Validación estricta con Zod de los montos y fechas extraídas por el LLM antes de ejecutar la inserción en la base de datos.
3. **Manejo de Errores y Caídas**:
   - Si el bot no tiene suficiente certeza sobre el monto o la cuenta, solicita aclaración en lenguaje natural en vez de guardar datos erróneos.
