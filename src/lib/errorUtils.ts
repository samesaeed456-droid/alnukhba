import { FirestoreErrorInfo, OperationType } from "./firebase";

export interface SmartError {
  message: string;
  technicalDetails?: string;
  code?: string;
  isConfigError?: boolean;
}

export function parseSmartError(error: any): SmartError {
  const msg = error instanceof Error ? error.message : String(error);
  const code = error.code || (msg.match(/\((auth\/[a-z0-9-]+)\)/)?.[1]);

  // If it's a Firebase Auth error
  if (code) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return {
          message: "بيانات الدخول غير صحيحة. يرجى التأكد من رقم الجوال/البريد وكلمة المرور.",
          code: code,
        };
      case "auth/email-already-in-use":
        return {
          message: "هذا الرقم مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.",
          code: code,
        };
      case "auth/network-request-failed":
        return {
          message: "فشل الاتصال بالشبكة، يرجى التأكد من اتصالك بالإنترنت",
          code: code,
        };
      case "auth/too-many-requests":
        return {
          message: "محاولات كثيرة خاطئة، تم حظر الحساب مؤقتاً للأمان",
          code: code,
        };
      case "auth/operation-not-allowed":
        return {
          message: "طريقة تسجيل الدخول هذه غير مفعلة في إعدادات Firebase",
          code: code,
          isConfigError: true,
        };
      default:
        // Use the default code if available, otherwise the message
        return {
          message: `خطأ في المصادقة: ${msg}`,
          code: code,
        };
    }
  }

  // Try to parse our custom Firestore JSON error
  try {
    const parsed = JSON.parse(msg) as FirestoreErrorInfo;
    if (parsed.error) {
      if (parsed.error.includes("Missing or insufficient permissions")) {
        return {
          message:
            "ليس لديك صلاحية للقيام بهذه العملية. يرجى التأكد من إعدادات الحماية (Rules).",
          technicalDetails: `Path: ${parsed.path}, Op: ${parsed.operationType}`,
          code: "permission-denied",
        };
      }
      if (
        parsed.error.includes("the client is offline") ||
        parsed.error.includes("Could not reach Cloud Firestore backend")
      ) {
        return {
          message:
            "تعذر الاتصال بقاعدة البيانات. يرجى التأكد من صحة مفاتيح Firebase في Vercel.",
          isConfigError: true,
          code: "offline",
        };
      }
      return {
        message: `خطأ في قاعدة البيانات: ${parsed.error}`,
        technicalDetails: JSON.stringify(parsed),
      };
    }
  } catch (e) {
    // Not a JSON error
  }

  // Fallback
  if (msg.includes("apiKey") || msg.includes("projectId")) {
    return {
      message: "إعدادات Firebase ناقصة أو غير صحيحة في Vercel",
      isConfigError: true,
    };
  }

  return { message: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً" };
}
