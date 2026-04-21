import { FirestoreErrorInfo, OperationType } from './firebase';

export interface SmartError {
  message: string;
  technicalDetails?: string;
  code?: string;
  isConfigError?: boolean;
}

export function parseSmartError(error: any): SmartError {
  // If it's a Firebase Auth error
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return { message: 'رقم الجوال أو كلمة المرور غير صحيحة', code: error.code };
      case 'auth/email-already-in-use':
        return { message: 'رقم الجوال مسجل مسبقاً، يرجى تسجيل الدخول', code: error.code };
      case 'auth/network-request-failed':
        return { message: 'فشل الاتصال بالشبكة، يرجى التأكد من اتصالك بالإنترنت', code: error.code };
      case 'auth/too-many-requests':
        return { message: 'محاولات كثيرة خاطئة، تم حظر الحساب مؤقتاً للأمان', code: error.code };
      case 'auth/operation-not-allowed':
        return { 
          message: 'طريقة تسجيل الدخول هذه غير مفعلة في إعدادات Firebase', 
          code: error.code,
          isConfigError: true 
        };
      default:
        return { message: `خطأ في المصادقة: ${error.message}`, code: error.code };
    }
  }

  // Try to parse our custom Firestore JSON error
  try {
    const parsed = JSON.parse(error.message) as FirestoreErrorInfo;
    if (parsed.error) {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        return { 
          message: 'ليس لديك صلاحية للقيام بهذه العملية. يرجى التأكد من إعدادات الحماية (Rules).',
          technicalDetails: `Path: ${parsed.path}, Op: ${parsed.operationType}`,
          code: 'permission-denied'
        };
      }
      if (parsed.error.includes('the client is offline') || parsed.error.includes('Could not reach Cloud Firestore backend')) {
        return { 
          message: 'تعذر الاتصال بقاعدة البيانات. يرجى التأكد من صحة مفاتيح Firebase في Vercel.',
          isConfigError: true,
          code: 'offline'
        };
      }
      return { message: `خطأ في قاعدة البيانات: ${parsed.error}`, technicalDetails: JSON.stringify(parsed) };
    }
  } catch (e) {
    // Not a JSON error
  }

  // Fallback
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('apiKey') || msg.includes('projectId')) {
    return { message: 'إعدادات Firebase ناقصة أو غير صحيحة في Vercel', isConfigError: true };
  }

  return { message: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' };
}
