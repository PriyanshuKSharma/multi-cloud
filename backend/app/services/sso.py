from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import os

# OAuth configuration
config = Config(environ={
    "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
    "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET", ""),
})

oauth = OAuth(config)

# Register Google OAuth
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

class SSOService:
    @staticmethod
    def get_oauth_client():
        """Get OAuth client instance"""
        return oauth
    
    @staticmethod
    async def get_google_user_info(token: dict) -> dict:
        """Extract user info from Google OAuth token"""
        return {
            "email": token.get("email"),
            "name": token.get("name"),
            "picture": token.get("picture"),
            "sub": token.get("sub"),  # Google user ID
        }
