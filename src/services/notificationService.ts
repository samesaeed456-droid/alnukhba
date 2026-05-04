import { Order } from "../types";

/**
 * Notification Service
 * Handles sending Push/Email notifications to customers.
 */

interface NotificationResponse {
  success: boolean;
  message: string;
  provider?: string;
}

export const notificationService = {
  /**
   * Sends a notification to the customer when their order status changes.
   */
  async sendOrderStatusNotification(
    order: Order,
    newStatus: Order["status"],
    isRevert: boolean = false,
  ): Promise<NotificationResponse> {
    const customerName = order.customerName || "عميلنا العزيز";
    const orderId = order.id.slice(-6).toUpperCase();
    const phone = order.customerPhone;

    // Define messages based on status
    let message = "";
    let subject = "";

    if (isRevert) {
      subject = `تحديث بخصوص طلبك رقم #${orderId}`;
      const statusText =
        newStatus === "pending"
          ? "قيد الانتظار للمراجعة"
          : newStatus === "processing"
            ? "قيد التجهيز"
            : newStatus === "shipped"
              ? "تم الشحن"
              : newStatus === "delivered"
                ? "تم التوصيل"
                : "ملغي";

      message = `عزيزي ${customerName}، نود إبلاغك بتحديث حالة طلبك رقم #${orderId} إلى (${statusText}) لمراجعة بعض التفاصيل. شكراً لتفهمك.`;

      if (order.status === "cancelled" && newStatus === "pending") {
        message = `مرحباً ${customerName}، تم إعادة تفعيل طلبك رقم #${orderId} بنجاح وهو الآن قيد المراجعة.`;
      }
    } else {
      switch (newStatus) {
        case "pending":
          subject = `تم استلام طلبك رقم #${orderId}`;
          message = `مرحباً ${customerName}، تم استلام طلبك رقم #${orderId} بنجاح وهو الآن قيد الانتظار للمراجعة.`;
          break;
        case "processing":
          subject = `طلبك رقم #${orderId} قيد التجهيز`;
          message = `مرحباً ${customerName}، طلبك رقم #${orderId} قيد التجهيز الآن. سنقوم بإبلاغك فور شحنه.`;
          break;
        case "shipped":
          subject = `تم شحن طلبك رقم #${orderId}`;
          message = `أخبار رائعة يا ${customerName}! تم شحن طلبك رقم #${orderId} وهو في طريقه إليك الآن.`;
          break;
        case "delivered":
          subject = `تم توصيل طلبك رقم #${orderId}`;
          message = `مرحباً ${customerName}، تم توصيل طلبك رقم #${orderId} بنجاح. نتمنى أن تنال المنتجات إعجابك!`;
          break;
        case "cancelled":
          subject = `تم إلغاء طلبك رقم #${orderId}`;
          message = `مرحباً ${customerName}، نأسف لإبلاغك بأنه تم إلغاء طلبك رقم #${orderId}. إذا كان لديك أي استفسار، يرجى التواصل معنا.`;
          break;
        default:
          return {
            success: false,
            message: "No notification defined for this status",
          };
      }
    }

    console.log(
      `[Notification Service] Sending ${newStatus} notification (isRevert: ${isRevert}) to ${phone}...`,
    );
    console.log(`[Subject] ${subject}`);
    console.log(`[Message] ${message}`);

    return {
      success: true,
      message: `تم إرسال التنبيه (${newStatus}) للعميل بنجاح`,
      provider: "System",
    };
  },

  /**
   * Sends a notification when a product is back in stock
   */
  async sendBackInStockNotification(
    productName: string,
    phone: string,
  ): Promise<NotificationResponse> {
    const message = `مرحباً، المنتج "${productName}" الذي كنت بانتظاره عاد للتوفر في المتجر الآن! سارع بالطلب قبل نفاذ الكمية.`;
    console.log("Mock Notification:", message);
    return { success: true, message: "تم إرسال تنبيه توفر المنتج بنجاح" };
  },

  /**
   * Sends a notification for a product on sale
   */
  async sendOnSaleNotification(
    productName: string,
    discount: string,
    phone: string,
  ): Promise<NotificationResponse> {
    const message = `أخبار رائعة! المنتج "${productName}" الآن عليه خصم ${discount}. تسوق الآن واستفد من العرض.`;
    console.log("Mock Notification:", message);
    return { success: true, message: "تم إرسال تنبيه التخفيض بنجاح" };
  },

  /**
   * Sends a general marketing or promotional notification
   */
  async sendMarketingNotification(
    title: string,
    content: string,
    phone: string,
  ): Promise<NotificationResponse> {
    const message = `${title}\n\n${content}`;
    console.log("Mock Notification:", message);
    return { success: true, message: "تم إرسال العرض الترويجي بنجاح" };
  },

  /**
   * Sends a system notification (e.g., welcome, password reset)
   */
  async sendSystemNotification(
    type: "welcome" | "password_reset",
    phone: string,
    extraData?: any,
  ): Promise<NotificationResponse> {
    let message = "";
    if (type === "welcome") {
      message = `مرحباً بك في متجرنا! يسعدنا انضمامك إلينا. نتمنى لك تجربة تسوق ممتعة.`;
    } else if (type === "password_reset") {
      message = `رمز إعادة تعيين كلمة المرور الخاص بك هو: ${extraData?.code || "---"}. لا تشارك هذا الرمز مع أحد.`;
    }

    console.log("Mock Notification:", message);
    return { success: true, message: "تم إرسال تنبيه النظام بنجاح" };
  },
};
