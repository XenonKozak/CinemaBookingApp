export interface QuotaStatus {
  isExceeded: boolean;
  isUnavailable: boolean;
  message: string;
}

export class FirebaseQuotaManager {
  private static quotaExceededCount = 0;
  private static readonly MAX_QUOTA_ERRORS = 3;
  private static readonly RESET_INTERVAL = 60000; // 1 minute


  static checkQuotaStatus(error: any): QuotaStatus {
    const isExceeded = this.isQuotaExceeded(error);
    const isUnavailable = this.isUnavailable(error);

    if (isExceeded) {
      this.quotaExceededCount++;
    }

    return {
      isExceeded,
      isUnavailable,
      message: this.getQuotaMessage(isExceeded, isUnavailable)
    };
  }

  
  private static isQuotaExceeded(error: any): boolean {
    return error.code === 'resource-exhausted' || 
           error.message?.includes('quota') ||
           error.message?.includes('Resource exhausted') ||
           error.message?.includes('Quota exceeded');
  }

  
  private static isUnavailable(error: any): boolean {
    return error.code === 'unavailable' || 
           error.code === 'permission-denied' ||
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  
  private static getQuotaMessage(isExceeded: boolean, isUnavailable: boolean): string {
    if (isExceeded) {
      if (this.quotaExceededCount >= this.MAX_QUOTA_ERRORS) {
        return 'Service temporarily unavailable due to high usage. Please try again in a few minutes.';
      }
      return 'Service experiencing high usage. Some features may be limited.';
    }
    
    if (isUnavailable) {
      return 'Service temporarily unavailable. Please check your internet connection.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }


  static shouldUseFallback(error: any): boolean {
    const status = this.checkQuotaStatus(error);
    return status.isExceeded || status.isUnavailable;
  }

  
  static resetQuotaCount(): void {
    setTimeout(() => {
      this.quotaExceededCount = 0;
    }, this.RESET_INTERVAL);
  }

  
  static getDebugInfo(): object {
    return {
      quotaExceededCount: this.quotaExceededCount,
      maxQuotaErrors: this.MAX_QUOTA_ERRORS,
      isDevelopment: process.env.NODE_ENV === 'development'
    };
  }
} 