import pyotp
import qrcode
from io import BytesIO
import base64

class TwoFactorService:
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(email: str, secret: str, issuer: str = "Multi-Cloud Platform") -> str:
        """Generate QR code for authenticator app"""
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=email, issuer_name=issuer)
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Return base64 encoded image
        return base64.b64encode(buffer.getvalue()).decode()
    
    @staticmethod
    def verify_token(secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
    
    @staticmethod
    def get_backup_codes(count: int = 8) -> list[str]:
        """Generate backup codes"""
        return [pyotp.random_base32()[:8] for _ in range(count)]
