import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface PassData {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  location: string;
  ticketCount: number;
  totalPrice: number;
  qrCode: string;
  holderName: string;
  organizerName: string;
  bookingId: string;
}

/**
 * Check if wallet functionality is available on the current platform
 */
export const isWalletAvailable = (): boolean => {
  // Wallet functionality is primarily available on mobile platforms
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Add ticket to mobile wallet (Apple Wallet or Google Pay)
 */
export const addToMobileWallet = async (passData: PassData): Promise<boolean> => {
  try {
    if (!isWalletAvailable()) {
      Alert.alert(
        'غير متاح',
        'إضافة التذاكر للمحفظة متاحة فقط على الهواتف المحمولة'
      );
      return false;
    }

    if (Platform.OS === 'ios') {
      // For iOS - Apple Wallet integration
      const passContent = generateAppleWalletPass(passData);
      const passUri = `${FileSystem.documentDirectory}ticket-${passData.bookingId}.pkpass`;
      
      await FileSystem.writeAsStringAsync(passUri, passContent);
      
      // In a real implementation, you would:
      // 1. Generate a proper .pkpass file with certificates
      // 2. Use expo-linking to open the pass
      // 3. Handle the wallet integration properly
      
      Alert.alert(
        'Apple Wallet',
        'تم إعداد التذكرة لإضافتها إلى Apple Wallet. في التطبيق الحقيقي، ستتم إضافتها تلقائياً.',
        [{ text: 'رائع!' }]
      );
      return true;
    } else if (Platform.OS === 'android') {
      // For Android - Google Pay integration
      const passContent = generateGooglePayPass(passData);
      
      // In a real implementation, you would:
      // 1. Use Google Pay API
      // 2. Generate proper JWT tokens
      // 3. Handle the Google Pay integration
      
      Alert.alert(
        'Google Pay',
        'تم إعداد التذكرة لإضافتها إلى Google Pay. في التطبيق الحقيقي، ستتم إضافتها تلقائياً.',
        [{ text: 'رائع!' }]
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error adding to wallet:', error);
    Alert.alert('خطأ', 'فشل في إضافة التذكرة للمحفظة');
    return false;
  }
};

/**
 * Download ticket as PDF or image file
 */
export const downloadTicket = async (passData: PassData): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // For web platform - trigger download
      const ticketContent = generateTicketHTML(passData);
      const blob = new Blob([ticketContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `mi3ad-ticket-${passData.bookingId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Alert.alert('تم التحميل', 'تم تحميل التذكرة بنجاح');
      return true;
    } else {
      // For mobile platforms - save to device storage
      const ticketContent = generateTicketHTML(passData);
      const fileUri = `${FileSystem.documentDirectory}mi3ad-ticket-${passData.bookingId}.html`;
      
      await FileSystem.writeAsStringAsync(fileUri, ticketContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/html',
          dialogTitle: 'حفظ التذكرة',
        });
      }
      
      Alert.alert('تم التحميل', 'تم حفظ التذكرة على جهازك');
      return true;
    }
  } catch (error) {
    console.error('Error downloading ticket:', error);
    Alert.alert('خطأ', 'فشل في تحميل التذكرة');
    return false;
  }
};

/**
 * Generate Apple Wallet pass content (simplified)
 */
const generateAppleWalletPass = (passData: PassData): string => {
  // This is a simplified version. In production, you would need:
  // 1. Apple Developer certificates
  // 2. Proper pass.json structure
  // 3. Digital signatures
  // 4. Images and assets
  
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.mi3ad.eventticket",
    serialNumber: passData.bookingId,
    teamIdentifier: "YOUR_TEAM_ID",
    organizationName: "Mi3AD",
    description: `تذكرة ${passData.eventTitle}`,
    logoText: "Mi3AD",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(168, 85, 247)",
    eventTicket: {
      primaryFields: [
        {
          key: "event",
          label: "الفعالية",
          value: passData.eventTitle
        }
      ],
      secondaryFields: [
        {
          key: "date",
          label: "التاريخ",
          value: passData.eventDate
        },
        {
          key: "time",
          label: "الوقت",
          value: passData.eventTime
        }
      ],
      auxiliaryFields: [
        {
          key: "location",
          label: "الموقع",
          value: passData.location
        },
        {
          key: "tickets",
          label: "عدد التذاكر",
          value: passData.ticketCount.toString()
        }
      ],
      backFields: [
        {
          key: "holder",
          label: "حامل التذكرة",
          value: passData.holderName
        },
        {
          key: "organizer",
          label: "المنظم",
          value: passData.organizerName
        },
        {
          key: "qr",
          label: "رمز التذكرة",
          value: passData.qrCode
        }
      ]
    },
    barcode: {
      message: passData.qrCode,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1"
    }
  };
  
  return JSON.stringify(passJson, null, 2);
};

/**
 * Generate Google Pay pass content (simplified)
 */
const generateGooglePayPass = (passData: PassData): string => {
  // This is a simplified version. In production, you would need:
  // 1. Google Pay API credentials
  // 2. Proper JWT structure
  // 3. Digital signatures
  
  const googlePayObject = {
    iss: "your-service-account@your-project.iam.gserviceaccount.com",
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: {
      eventTicketObjects: [
        {
          id: `${passData.bookingId}`,
          classId: "mi3ad_event_ticket_class",
          state: "ACTIVE",
          ticketHolderName: passData.holderName,
          eventName: {
            defaultValue: {
              language: "ar",
              value: passData.eventTitle
            }
          },
          venue: {
            name: {
              defaultValue: {
                language: "ar",
                value: passData.location
              }
            }
          },
          dateTime: {
            start: `${passData.eventDate}T${passData.eventTime}:00`,
          },
          barcode: {
            type: "QR_CODE",
            value: passData.qrCode
          }
        }
      ]
    }
  };
  
  return JSON.stringify(googlePayObject, null, 2);
};

/**
 * Generate HTML content for the ticket
 */
const generateTicketHTML = (passData: PassData): string => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تذكرة Mi3AD - ${passData.eventTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #A855F7, #3B82F6);
            min-height: 100vh;
            direction: rtl;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .ticket-container {
            background: white;
            border-radius: 24px;
            overflow: hidden;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            position: relative;
        }
        
        .ticket-header {
            background: linear-gradient(135deg, #A855F7, #7C3AED);
            color: white;
            padding: 30px 24px;
            text-align: center;
            position: relative;
        }
        
        .ticket-header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 20px;
            height: 20px;
            background: white;
            border-radius: 50%;
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .ticket-type {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 500;
        }
        
        .ticket-body {
            padding: 30px 24px;
        }
        
        .event-title {
            font-size: 22px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 24px;
            text-align: center;
            line-height: 1.4;
        }
        
        .holder-section {
            background: #F8FAFC;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: center;
            border: 2px dashed #E2E8F0;
        }
        
        .holder-label {
            font-size: 14px;
            color: #64748B;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .holder-name {
            font-size: 18px;
            font-weight: bold;
            color: #1E293B;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .event-details {
            margin-bottom: 30px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #F1F5F9;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            color: #64748B;
            font-weight: 500;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .detail-value {
            color: #1E293B;
            font-weight: 600;
            font-size: 14px;
            text-align: left;
        }
        
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 24px;
            background: #F8FAFC;
            border-radius: 16px;
            border: 2px dashed #CBD5E1;
        }
        
        .qr-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 16px;
        }
        
        .qr-code {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: bold;
            color: #A855F7;
            letter-spacing: 2px;
            margin: 16px 0;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #E2E8F0;
        }
        
        .qr-instruction {
            font-size: 12px;
            color: #64748B;
            margin-top: 12px;
        }
        
        .footer {
            text-align: center;
            color: #64748B;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #E2E8F0;
        }
        
        .footer-line {
            margin-bottom: 4px;
        }
        
        .warning {
            background: #FEF3C7;
            color: #92400E;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-top: 16px;
            border-left: 4px solid #F59E0B;
        }
        
        @media print {
            body { 
                background: white; 
                padding: 0;
            }
            .ticket-container { 
                box-shadow: none; 
                max-width: none;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .ticket-header {
                padding: 24px 20px;
            }
            
            .ticket-body {
                padding: 24px 20px;
            }
            
            .event-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="ticket-container">
        <div class="ticket-header">
            <div class="logo">🎫 Mi3AD</div>
            <div class="ticket-type">تذكرة دخول إلكترونية</div>
        </div>
        
        <div class="ticket-body">
            <div class="event-title">${passData.eventTitle}</div>
            
            <div class="holder-section">
                <div class="holder-label">حامل التذكرة</div>
                <div class="holder-name">
                    👤 ${passData.holderName}
                </div>
            </div>
            
            <div class="event-details">
                <div class="detail-row">
                    <span class="detail-label">📅 التاريخ:</span>
                    <span class="detail-value">${passData.eventDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 الوقت:</span>
                    <span class="detail-value">${passData.eventTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 الموقع:</span>
                    <span class="detail-value">${passData.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🎫 عدد التذاكر:</span>
                    <span class="detail-value">${passData.ticketCount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">💰 السعر الإجمالي:</span>
                    <span class="detail-value">${passData.totalPrice === 0 ? 'مجاني' : `${passData.totalPrice} د.ل`}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🏢 المنظم:</span>
                    <span class="detail-value">${passData.organizerName}</span>
                </div>
            </div>
            
            <div class="qr-section">
                <div class="qr-title">رمز التذكرة الإلكتروني</div>
                <div class="qr-code">${passData.qrCode}</div>
                <div class="qr-instruction">
                    امسح هذا الرمز عند نقطة الدخول للتحقق من صحة التذكرة
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-line">تطبيق Mi3AD - إدارة الفعاليات والمناسبات</div>
                <div class="footer-line">تم إنشاء التذكرة في: ${new Date().toLocaleDateString('ar-LY')} - ${new Date().toLocaleTimeString('ar-LY')}</div>
                <div class="footer-line">رقم التذكرة: ${passData.bookingId}</div>
            </div>
            
            <div class="warning">
                ⚠️ تحذير: هذه التذكرة صالحة لمرة واحدة فقط. لا تشاركها مع الآخرين. 
                احتفظ بها في مكان آمن حتى يوم الفعالية.
            </div>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate a shareable ticket link
 */
export const generateShareableLink = (ticketId: string): string => {
  const baseUrl = Platform.OS === 'web' 
    ? window.location.origin 
    : 'https://mi3ad.app'; // Replace with your actual domain
  
  return `${baseUrl}/ticket/${ticketId}`;
};

/**
 * Validate ticket QR code format
 */
export const validateQRCode = (qrCode: string): boolean => {
  // Basic validation for Mi3AD ticket format
  const qrPattern = /^MI3AD-\d+-\w+$/;
  return qrPattern.test(qrCode);
};

/**
 * Generate Apple Wallet pass URL (for real implementation)
 */
export const generateAppleWalletURL = (passData: PassData): string => {
  // In production, this would generate a proper .pkpass file URL
  return `https://api.mi3ad.app/wallet/apple/${passData.bookingId}.pkpass`;
};

/**
 * Generate Google Pay save URL (for real implementation)
 */
export const generateGooglePayURL = (passData: PassData): string => {
  // In production, this would generate a proper Google Pay save URL
  const jwt = generateGooglePayPass(passData);
  return `https://pay.google.com/gp/v/save/${encodeURIComponent(jwt)}`;
};
